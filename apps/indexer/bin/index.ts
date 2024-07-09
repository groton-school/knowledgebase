#!/usr/bin/env tsx
import cli from '@battis/qui-cli';
import { drive_v3 } from '@googleapis/drive';
import Google from '@groton/knowledgebase.google';
import Index from '@groton/knowledgebase.index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOLDER_ID = '%FOLDER_ID%';
const FOLDER_NAME = '%FOLDER_NAME%';
const TIMESTAMP = '%TIMESTAMP%';

const defaultIndexPath = path.resolve(__dirname, '../../router/var/index.json');
const defaultKeysPath = path.resolve(__dirname, '../var/keys.json');
const defaultTokensPath = path.resolve(__dirname, '../var/tokens.json');

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

function colorizePath(p: string) {
  return (
    cli.colors.url(path.dirname(p) + '/') + cli.colors.value(path.basename(p))
  );
}

(async () => {
  const CWD = process.cwd();
  let {
    values: { folderId, indexPath, keysPath, tokensPath }
  } = cli.init({
    env: {
      root: path.join(__dirname, '../../..'),
      loadDotEnv: path.join(__dirname, '../../../.env')
    },
    args: { options }
  });

  Google.Client.init({ keysPath, tokensPath });

  const spinner = cli.spinner();
  Index.Folder.event.on(Index.File.Event.Start, (status): void => {
    spinner.start(colorizePath(status));
  });
  Index.Folder.event.on(Index.File.Event.Succeed, (status): void => {
    spinner.succeed(colorizePath(status));
  });
  Index.Folder.event.on(Index.File.Event.Fail, (status): void => {
    spinner.fail(colorizePath(status));
  });

  if (indexPath && fs.existsSync(path.resolve(CWD, indexPath))) {
    indexPath = path.resolve(CWD, indexPath);
    spinner.start(`Loading index from ${cli.colors.url(indexPath)}`);
    let index = JSON.parse((await fs.readFileSync(indexPath)).toString());
    spinner.succeed(`${cli.colors.value(index[0].name)} index loaded`);

    index = index[0].indexContents();

    spinner.start(`Writing index to ${cli.colors.url(indexPath)}`);
    fs.writeFileSync(indexPath, JSON.stringify(index));
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
    const folder = await Index.Folder.fromDriveId(folderId);
    const index: drive_v3.Schema$File[] = [folder];
    index.push(...(await folder.indexContents()));
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
