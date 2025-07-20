import { PathString } from '@battis/descriptive-types';
import { Colors } from '@battis/qui-cli.colors';
import { Env } from '@battis/qui-cli.env';
import * as Plugin from '@battis/qui-cli.plugin';
import { Root } from '@battis/qui-cli.root';
import { Validators } from '@battis/qui-cli.validators';
import { Google } from '@groton/knowledgebase.google';
import { input } from '@inquirer/prompts';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import shelljs from 'shelljs';
import ACL from '../ACL/index.js';
import Cache from '../Cache/index.js';
import Helper from '../Helper/index.js';

export type Configuration = Plugin.Configuration & {
  folderId?: string;
  indexPath?: PathString;
  permissionsRegex?: string | RegExp;
  keysPath?: PathString;
  tokensPath?: PathString;
};

const ROOT_FOLDER_ID = 'ROOT_FOLDER_ID';
const PERMISSIONS_REGEX = 'PERMISSIONS_REGEX';

const FOLDER_ID = '%FOLDER_ID%';
const FOLDER_NAME = '%FOLDER_NAME%';
const TIMESTAMP = '%TIMESTAMP%';

const CWD = process.cwd();

export const name = 'sync';

let folderId: string | undefined = undefined;
let indexPath = path.resolve(import.meta.dirname, '../../dist/index.json');
let permissionsRegex = /.*/;
let keysPath = path.resolve(import.meta.dirname, '../../var/keys.json');
let tokensPath = path.resolve(import.meta.dirname, '../../var/tokens.json');

export function configure(config: Configuration = {}) {
  folderId = Plugin.hydrate(config.folderId, folderId);
  indexPath = Plugin.hydrate(config.indexPath, indexPath);
  if (config.permissionsRegex) {
    if (config.permissionsRegex instanceof RegExp) {
      permissionsRegex = config.permissionsRegex;
    } else {
      permissionsRegex = new RegExp(config.permissionsRegex);
    }
  }
  keysPath = Plugin.hydrate(config.keysPath, keysPath);
  tokensPath = Plugin.hydrate(config.tokensPath, tokensPath);
}

export function options(): Plugin.Options {
  return {
    opt: {
      folderId: {
        short: 'f',
        description: `Google Drive ID of folder to index (will be read from ${Colors.value(
          ROOT_FOLDER_ID
        )} environment variable if present)`
      },
      indexPath: {
        short: 'i',
        description: `Output JSON file path (use ${Colors.value(
          FOLDER_NAME
        )}, ${Colors.value(FOLDER_ID)}, and ${Colors.value(
          TIMESTAMP
        )} placeholders, if so desired). If the file already exists, the index will be updated. (defaults to ${Colors.url(
          indexPath
        )})`,
        default: indexPath
      },
      permissionsRegex: {
        short: 'p',
        description: `Regular expression to match processed users/groups (will be read from ${Colors.value(
          PERMISSIONS_REGEX
        )} environment variable if present or default to ${Colors.value(
          '.*'
        )} if no enviroment variable is set or argument is passed)`
      },
      keysPath: {
        short: 'k',
        description: `Path to file containing downloaded OAuth2 credentials (defaults to ${Colors.url(
          keysPath
        )})`,
        default: keysPath
      },
      tokensPath: {
        short: 't',
        description: `Path to file containing access tokens (defaults to ${Colors.url(
          tokensPath
        )})`,
        default: tokensPath
      }
    }
  };
}

export async function init({
  values
}: Plugin.ExpectedArguments<typeof options>) {
  const { folderId, permissionsRegex, ...rest } = values;
  await Env.configure({
    root: path.join(import.meta.dirname, '../../../..'),
    loadDotEnv: path.join(import.meta.dirname, '../../../../.env')
  });
  configure({
    folderId: folderId || process.env[ROOT_FOLDER_ID],
    permissionsRegex: permissionsRegex || process.env[PERMISSIONS_REGEX],
    ...rest
  });
}

export async function run() {
  Google.Client.init({ keysPath: keysPath, tokensPath: tokensPath });

  const spinner = ora();
  Cache.File.bindSpinner(spinner, Helper.colorizeStatus);

  if (indexPath && fs.existsSync(path.resolve(CWD, indexPath))) {
    indexPath = path.resolve(CWD, indexPath);
    spinner.start(`Loading index from ${Colors.url(indexPath)}`);
    const prevIndex = await Cache.fromFile(indexPath);
    if (!prevIndex.root) {
      spinner.fail(
        `Missing root path in ${Colors.url(path.dirname(indexPath))}/${Colors.value(path.basename(indexPath))}`
      );
      process.exit(1);
    }
    spinner.succeed(`${Colors.value(prevIndex.root.name)} index loaded`);

    const currIndex = [
      await new Cache.FileFactory(Cache.File).fromDriveId(
        prevIndex.root.id,
        permissionsRegex
      )
    ];
    currIndex.push(...(await currIndex[0].indexContents(permissionsRegex)));

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
            permissionsRegex.test(permission.emailAddress || '') &&
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

    spinner.start(`Writing new index to ${Colors.url(indexPath)}`);
    fs.writeFileSync(indexPath, JSON.stringify(nextIndex));
    spinner.succeed(`Updated index at ${Colors.url(indexPath)}`);
  } else {
    // build from scratch
    folderId =
      folderId ||
      process.env.ROOT_FOLDER_ID ||
      (await input({
        message: options().opt!.folderId.description!,
        validate: Validators.notEmpty
      }));
    const folder = await new Cache.FileFactory(Cache.File).fromDriveId(
      folderId,
      permissionsRegex
    );
    const index: Cache.File[] = [folder];
    index.push(...(await folder.indexContents(permissionsRegex)));
    indexPath = path.resolve(
      CWD,
      (
        indexPath ||
        (await input({
          message: options().opt!.indexPath.description!,
          default: path.resolve(Root.path(), '../router/var/index.json'),
          validate: Validators.notEmpty
        }))
      )
        .replace(FOLDER_ID, folderId)
        .replace(FOLDER_NAME, folder.name!)
        .replace(TIMESTAMP, new Date().toISOString().replace(':', '-'))
    );

    spinner.start(`Saving index to ${indexPath}`);
    const content = JSON.stringify(index);
    shelljs.mkdir('-p', path.dirname(indexPath));
    fs.writeFileSync(indexPath, content);
    spinner.succeed(`Index saved to ${Colors.url(indexPath)}`);
  }
}
