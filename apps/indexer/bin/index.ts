import cli from '@battis/qui-cli';
import Google from '@groton/knowledgebase.google';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import ACL from '../src/ACL/index.js';
import Cache from '../src/Cache/index.js';
import Helper from '../src/Helper/index.js';

const FOLDER_ID = '%FOLDER_ID%';
const FOLDER_NAME = '%FOLDER_NAME%';
const TIMESTAMP = '%TIMESTAMP%';

const defaultIndexPath = path.resolve(
  import.meta.dirname,
  '../dist/index.json'
);
const defaultKeysPath = path.resolve(import.meta.dirname, '../var/keys.json');
const defaultTokensPath = path.resolve(
  import.meta.dirname,
  '../var/tokens.json'
);

const options = {
  folderId: {
    short: 'f',
    description: `Google Drive ID of folder to index (will be read from ${cli.colors.value(
      'ROOT_FOLDER_ID'
    )} environment variable if present)`
  },
  indexPath: {
    short: 'i',
    description: `Output JSON file path (use ${cli.colors.value(
      FOLDER_NAME
    )}, ${cli.colors.value(FOLDER_ID)}, and ${cli.colors.value(
      TIMESTAMP
    )} placeholders, if so desired). If the file already exists, the index will be updated. (defaults to ${cli.colors.url(
      defaultIndexPath
    )})`,
    default: defaultIndexPath
  },
  permissionsRegex: {
    short: 'p',
    description: `Regular expression to match processed users/groups (will be read from ${cli.colors.value(
      'PERMISSIONS_REGEX'
    )} environment variable if present or default to ${cli.colors.value(
      '.*'
    )} if no enviroment variable is set or argument is passed)`
  },
  keysPath: {
    short: 'k',
    description: `Path to file containing downloaded OAuth2 credentials (defaults to ${cli.colors.url(
      defaultKeysPath
    )})`,
    default: defaultKeysPath
  },
  tokensPath: {
    short: 't',
    description: `Path to file containing access tokens (defaults to ${cli.colors.url(
      defaultTokensPath
    )})`,
    default: defaultTokensPath
  }
};

(async () => {
  const CWD = process.cwd();
  let {
    values: { folderId, indexPath, keysPath, tokensPath, permissionsRegex }
  } = cli.init({
    env: {
      root: path.join(import.meta.dirname, '../../..'),
      loadDotEnv: path.join(import.meta.dirname, '../../../.env')
    },
    args: { options }
  });

  Google.Client.init({ keysPath, tokensPath });
  const permissionsPattern = new RegExp(
    permissionsRegex || process.env.PERMISSIONS_REGEX || '.*'
  );

  const spinner = ora();
  Cache.File.bindSpinner(spinner, Helper.colorizeStatus);

  if (indexPath && fs.existsSync(path.resolve(CWD, indexPath))) {
    indexPath = path.resolve(CWD, indexPath);
    spinner.start(`Loading index from ${cli.colors.url(indexPath)}`);
    const prevIndex = await Cache.fromFile(indexPath);
    if (!prevIndex.root) {
      spinner.fail(
        `Missing root path in ${cli.colors.url(path.dirname(indexPath))}/${cli.colors.value(path.basename(indexPath))}`
      );
      process.exit(1);
    }
    spinner.succeed(`${cli.colors.value(prevIndex.root.name)} index loaded`);

    const currIndex = [
      await new Cache.FileFactory(Cache.File).fromDriveId(
        prevIndex.root.id,
        permissionsPattern
      )
    ];
    currIndex.push(...(await currIndex[0].indexContents(permissionsPattern)));

    spinner.start(`Comparing indices`);
    // TODO reset permissions
    const nextIndex: typeof currIndex = [];
    prevIndex.forEach((p) => {
      const prev = p as ACL.File;
      spinner.start(prev.index.path);
      let update = p;
      const i = currIndex.findIndex((elt) => elt.index.path == prev.index.path);
      if (i >= 0) {
        const permissions: Google.Drive.drive_v3.Schema$Permission[] = [];
        for (const permission of prev.permissions || []) {
          if (
            !(currIndex[i].permissions || []).find(
              (p: Google.Drive.drive_v3.Schema$Permission) =>
                p.emailAddress == permission.emailAddress
            )
          ) {
            permission.indexerAclState = Cache.IndexEntry.State.Expired;
            spinner.fail(
              `Expired ${permission.emailAddress} from ${prev.index.path}`
            );
          }
          permissions.push(permission);
        }
        for (const permission of currIndex[i].permissions || []) {
          if (
            permissionsPattern.test(permission.emailAddress || '') &&
            !permissions.find((p) => p.emailAddress == permission.emailAddress)
          ) {
            permissions.push(permission);
            spinner.succeed(
              `Added ${permission.emailAddress} to ${currIndex[i].index.path}`
            );
          }
        }
        update = currIndex[i];
        update.index = prev.index;
        update.permissions = permissions;
        currIndex.splice(i, 1);
      } else {
        update.index.status = Cache.IndexEntry.State.Expired;
        update.index.exists = false;
      }
      nextIndex.push(update);
    });
    currIndex.forEach((elt) => {
      spinner.start(elt.index.path);
      nextIndex.push(elt);
    });
    spinner.succeed('Indices merged');

    spinner.start(`Writing new index to ${cli.colors.url(indexPath)}`);
    fs.writeFileSync(indexPath, JSON.stringify(nextIndex));
    spinner.succeed(`Updated index at ${cli.colors.url(indexPath)}`);
  } else {
    // build from scratch
    folderId =
      folderId ||
      process.env.ROOT_FOLDER_ID ||
      (await cli.prompts.input({
        message: options.folderId.description,
        validate: cli.validators.notEmpty
      }));
    const folder = await new Cache.FileFactory(Cache.File).fromDriveId(
      folderId,
      permissionsPattern
    );
    const index: Cache.File[] = [folder];
    index.push(...(await folder.indexContents(permissionsPattern)));
    indexPath = path.resolve(
      CWD,
      (
        indexPath ||
        (await cli.prompts.input({
          message: options.indexPath.description,
          default: path.resolve(cli.appRoot(), '../router/var/index.json'),
          validate: cli.validators.notEmpty
        }))
      )
        .replace(FOLDER_ID, folderId)
        .replace(FOLDER_NAME, folder.name!)
        .replace(TIMESTAMP, new Date().toISOString().replace(':', '-'))
    );

    spinner.start(`Saving index to ${indexPath}`);
    const content = JSON.stringify(index);
    cli.shell.mkdir('-p', path.dirname(indexPath));
    fs.writeFileSync(indexPath, content);
    spinner.succeed(`Index saved to ${cli.colors.url(indexPath)}`);
  }
})();
