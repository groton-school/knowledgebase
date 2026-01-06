import { PathString } from '@battis/descriptive-types';
import { Colors } from '@battis/qui-cli.colors';
import { Env } from '@battis/qui-cli.env';
import * as Plugin from '@battis/qui-cli.plugin';
import { Validators } from '@battis/qui-cli.validators';
import { Google } from '@groton/knowledgebase.google';
import { IndexFactory, State } from '@groton/knowledgebase.index';
import { input } from '@inquirer/prompts';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import * as Cache from '../Cache/index.js';
import * as Helper from '../Helper/index.js';

export type Configuration = Plugin.Configuration & {
  bucketName?: string;
  indexPath?: PathString;
  keysPath?: PathString;
  tokensPath?: PathString;
  chunkSize?: number;
  force?: boolean;
  ignoreErrors?: boolean;
};

const CWD = process.cwd();
const BUCKET = 'BUCKET';

export const name = 'cache';

let bucketName: string | undefined = undefined;
let indexPath = path.resolve(import.meta.dirname, '../../dist/index.json');
let keysPath = path.resolve(import.meta.dirname, '../../var/keys.json'); //FIXME keys.json needs to be downloaded as part of the setup wizard
let tokensPath = path.resolve(import.meta.dirname, '../../var/tokens.json'); // FIXME tokens should be stored in 1Password
let chunkSize = 25;
let force = false;
let ignoreErrors = true;

export function configure(config: Configuration = {}) {
  bucketName = Plugin.hydrate(config.bucketName, bucketName);
  indexPath = Plugin.hydrate(config.indexPath, indexPath);
  keysPath = Plugin.hydrate(config.keysPath, keysPath);
  tokensPath = Plugin.hydrate(config.tokensPath, tokensPath);
  chunkSize = Plugin.hydrate(config.chunkSize, chunkSize);
  force = Plugin.hydrate(config.force, force);
  ignoreErrors = Plugin.hydrate(config.ignoreErrors, ignoreErrors);
}

export function options(): Plugin.Options {
  return {
    opt: {
      bucketName: {
        short: 'b',
        description: `Google Cloud Storage bucket name (will be read from ${Colors.value(
          BUCKET
        )} environment variable if present)`
      },
      indexPath: {
        short: 'i',
        description: `Path to index file (defaults to ${Colors.url(
          indexPath
        )})`,
        default: indexPath
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
    },
    num: {
      chunkSize: {
        description: `Number of files to simultaneously cache (defaults to ${Colors.value(chunkSize)})`,
        default: 25,
        validate: (value?: unknown) =>
          !!value &&
          typeof value === 'number' &&
          value > 0 &&
          Math.floor(value) == value
      }
    },
    flag: {
      force: {
        short: 'f',
        description: 'Force upload of all files, ignoring current index status',
        default: false
      },
      ignoreErrors: {
        description:
          'Ignore errors and continue uploading (default true, stop on errors with --no-ignore-errors',
        default: true
      }
    }
  };
}

export async function init({
  values
}: Plugin.ExpectedArguments<typeof options>) {
  const { bucketName, ...rest } = values;
  await Env.configure({
    root: path.join(import.meta.dirname, '../../../..'),
    loadDotEnv: path.join(import.meta.dirname, '../../../../.env')
  });
  configure({ bucketName: bucketName || process.env[BUCKET], ...rest });
}

export async function run() {
  Google.Client.init({ keysPath, tokensPath });

  const spinner = ora();
  Cache.File.bindSpinner(spinner, Helper.colorizeStatus);

  indexPath = path.resolve(CWD, indexPath);

  spinner.start(`Loading index from ${Colors.url(indexPath)}`);
  const index = await new IndexFactory(Cache.File).fromFile(indexPath);
  if (!index.root) {
    spinner.fail(
      `Missing root path in ${Colors.url(path.dirname(indexPath))}/${Colors.value(path.basename(indexPath))}`
    );
    process.exit(1);
  }
  spinner.succeed(`${Colors.value(index.root.name)} index loaded`);

  bucketName =
    bucketName ||
    (await input({
      message: options().opt!.bucketName.description!,
      validate: Validators.lengthBetween(6, 30)
    }));

  spinner.start('Reviewing index files');
  for (let i = 0; i < index.length; i += chunkSize) {
    await Promise.allSettled(
      index.slice(i, i + chunkSize).map((entry) => {
        if (entry.index.path != '.') {
          return entry.cache({
            bucketName: bucketName!,
            force,
            ignoreErrors
          });
        }
      })
    );
  }
  const updatedIndex = index.filter(
    (entry) =>
      !(entry.index.exists === false && entry.index.status === State.Expired)
  );
  spinner.succeed('All indexed files reviewed');

  spinner.start(`Saving index to ${Colors.url(indexPath)}`);
  fs.writeFileSync(indexPath, JSON.stringify(updatedIndex));
  spinner.succeed(`Index saved to ${Colors.url(indexPath)}`);
}
