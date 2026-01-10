import { PathString } from '@battis/descriptive-types';
import { IndexFactory } from '@groton/knowledgebase.index';
import { input } from '@inquirer/prompts';
import { Colors } from '@qui-cli/colors';
import { Env } from '@qui-cli/env-1password';
import * as Plugin from '@qui-cli/plugin';
import { Validators } from '@qui-cli/validators';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import * as ACL from '../ACL/index.js';
import * as Helper from '../Helper/index.js';

// TODO why does reset-permissions need to run separately from upload?
// TODO version of reset-permissions that resets only recent uploads

export type Configuration = Plugin.Configuration & {
  bucketName?: string;
  indexPath?: PathString;
  permissionsRegex?: string | RegExp;
  ignoreErrors?: boolean;
};

const CWD = process.cwd();
const BUCKET = 'BUCKET';
const PERMISSIONS_REGEX = 'PERMISSIONS_REGEX';

export const name = 'acl';

let bucketName: string | undefined = undefined;
let indexPath = path.resolve(import.meta.dirname, '../../dist/index.json');
let permissionsRegex = /.*/;
let ignoreErrors = true;

export function configure(config: Configuration = {}) {
  bucketName = Plugin.hydrate(config.bucketName, bucketName);
  indexPath = Plugin.hydrate(config.indexPath, indexPath);
  if (config.permissionsRegex) {
    if (config.permissionsRegex instanceof RegExp) {
      permissionsRegex = config.permissionsRegex;
    } else {
      permissionsRegex = new RegExp(config.permissionsRegex);
    }
  }
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
      permissionsRegex: {
        short: 'p',
        description: `Regular expression to email addresses of users/groups to include in Cloud Storage Bucket (will be read from ${Colors.value(
          PERMISSIONS_REGEX
        )} environment variable if present, defaults to ${Colors.regexpValue(
          permissionsRegex.source
        )} if no argument or environment variable is present)`
      }
    },
    flag: {
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
  // FIXME should not include files from outside the package
  await Env.configure({
    root: path.join(import.meta.dirname, '../../../..'),
    loadDotEnv: path.join(import.meta.dirname, '../../../../.env')
  });
  const { bucketName, permissionsRegex, ...rest } = values;
  configure({
    bucketName: bucketName || process.env[BUCKET],
    permissionsRegex: permissionsRegex || process.env[PERMISSIONS_REGEX],
    ...rest
  });
}

export async function run() {
  const spinner = ora();
  ACL.File.bindSpinner(spinner, Helper.colorizeStatus);

  indexPath = path.resolve(CWD, indexPath);

  spinner.start(`Loading index from ${Colors.url(indexPath)}`);

  const index = await new IndexFactory(ACL.File).fromFile(indexPath);
  if (!index.root) {
    spinner.fail(
      `Missing root path in ${Colors.url(path.dirname(indexPath))}/${Colors.value(path.basename(indexPath))}`
    );
    process.exit(1);
  }
  spinner.succeed(`${Colors.value(index.root.name)} index loaded`);

  bucketName =
    bucketName ||
    process.env.BUCKET ||
    (await input({
      message: options().opt!.bucketName.description!,
      validate: Validators.lengthBetween(6, 30)
    }));

  permissionsRegex = permissionsRegex || process.env.PERMISSIONS_REGEX || '.*';

  spinner.start('Reviewing permission changes');
  await Promise.allSettled(
    index.map((file) =>
      file.cache({
        bucketName: bucketName!,
        permissionsRegex,
        ignoreErrors: !!ignoreErrors
      })
    )
  );
  spinner.succeed('All permission changes reviewed');

  spinner.start(`Saving index to ${Colors.url(indexPath)}`);
  fs.writeFileSync(indexPath, JSON.stringify(index));
  spinner.succeed(`Index saved to ${Colors.url(indexPath)}`);
}
