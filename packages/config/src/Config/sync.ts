import { Colors } from '@battis/qui-cli.colors';
import { Positionals } from '@battis/qui-cli.core';
import { Env } from '@battis/qui-cli.env';
import * as Plugin from '@battis/qui-cli.plugin';
import { JSONObject } from '@battis/typescript-tricks';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import shelljs from 'shelljs';
import { Config } from './Config.js';
import { createDefault } from './createDefault.js';

export type Configuration = Plugin.Configuration & {
  overwrite?: boolean;
  filter?: (config: JSONObject) => JSONObject;
};

const CWD = process.cwd();

export const name = 'sync-config';

let overwrite = false;
let filter = (a: JSONObject) => a;

export function configure(config: Configuration = {}) {
  overwrite = Plugin.hydrate(config.overwrite, overwrite);
  filter = Plugin.hydrate(config.filter, filter);
}

export function options(): Plugin.Options {
  Positionals.require({
    source: {
      description: `Path to source config.json`
    },
    destination: {
      description: `Path to local destination config.json`
    }
  });
  Positionals.allowOnlyNamedArgs();
  return {
    flag: {
      overwrite: {
        short: 'o',
        description:
          'Overwrite any existing local configuration file (if false, sequential backups are made)',
        default: overwrite
      }
    }
  };
}

export async function init({
  values
}: Plugin.ExpectedArguments<typeof options>) {
  await Env.configure();
  configure(values);
}

function backup(targetPath: string) {
  let backupPath: string = targetPath;
  for (let counter = 1; fs.existsSync(backupPath); counter++) {
    backupPath = targetPath.replace(/(\.\w+)$/, `.${counter}$1`);
  }
  shelljs.mv(targetPath, backupPath);
  return backupPath;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compare(a: any, b: any): boolean {
  for (const aKey in a) {
    if (!(aKey in b) || typeof b[aKey] != typeof a[aKey]) {
      return false;
    }
    if (
      (typeof a[aKey] == 'object' && !compare(a[aKey], b[aKey])) ||
      (typeof a[aKey] != 'object' && a[aKey] != b[aKey])
    ) {
      return false;
    }
  }
  for (const bKey in b) {
    if (!(bKey in a)) {
      return false;
    }
  }
  return true;
}

export async function run() {
  const source = Positionals.get('source');
  const destination = Positionals.get('destination');
  if (!source || !destination) {
    throw new Error();
  }

  const sourcePath = path.resolve(CWD, source);
  const destPath = path.resolve(CWD, destination);

  const spinner = ora();
  spinner.start(`Seeking configuration ${Colors.url(sourcePath)}`);

  let src: JSONObject,
    dest: JSONObject,
    curr: object | undefined = undefined;

  if (fs.existsSync(sourcePath)) {
    src = JSON.parse(fs.readFileSync(sourcePath).toString());
    spinner.start(`Configuration parsed`);
  } else {
    src = createDefault();
    spinner.fail(`$Configuration ${Colors.url(sourcePath)} not found`);
    spinner.succeed('Default configuration created');
  }

  if (fs.existsSync(destPath)) {
    curr = JSON.parse(fs.readFileSync(destPath).toString());
  }

  if (filter) {
    spinner.start(`Filtering configuration`);
    dest = filter(src);
  } else {
    dest = src;
  }

  if (!overwrite && curr && !compare(dest, curr)) {
    spinner.start(`Backing up ${Colors.url(destPath)}`);
    spinner.succeed(`Backup created at ${Colors.url(backup(destPath))}`);
  }

  fs.writeFileSync(destPath, JSON.stringify(dest));
  spinner.succeed(`Configuration synced to ${Colors.url(destPath)}`);

  return dest as Partial<Config>;
}
