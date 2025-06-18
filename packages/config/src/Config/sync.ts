import CLI from '@battis/qui-cli';
import { JSONObject } from '@battis/typescript-tricks';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ora from 'ora';
import { Config } from './Config.js';
import createDefault from './createDefault.js';

function backup(targetPath: string) {
  let backupPath: string = targetPath;
  for (let counter = 1; fs.existsSync(backupPath); counter++) {
    backupPath = targetPath.replace(/(\.\w+)$/, `.${counter}$1`);
  }
  CLI.shell.mv(targetPath, backupPath);
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

export default async function sync(
  {
    env
  }: {
    env: { root: string; loadDotEnv?: string };
  },
  filter?: (config: JSONObject) => JSONObject
) {
  let configPath = path.resolve(env.root, 'var/config.json');
  const args = {
    opt: {
      configPath: {
        short: 'c',
        description: `Path to the configuration file, relative to package root (default ${CLI.colors.url(
          configPath
        )})`,
        default: configPath
      }
    },
    flag: {
      overwrite: {
        short: 'o',
        description:
          'Overwrite any existing local configuration file (if false, sequential backups are made)',
        default: false
      }
    }
  };

  await CLI.configure({ env });
  let {
    // eslint-disable-next-line prefer-const
    values: { configPath: _configPath, overwrite }
  } = await CLI.init(args);

  configPath = path.resolve(env.root, _configPath!);
  const localConfigPath = args.opt.configPath.default;

  const spinner = ora();
  spinner.start(`Seeking configuration ${CLI.colors.url(configPath)}`);

  let src: JSONObject,
    dest: JSONObject,
    curr: object | undefined = undefined;

  if (fs.existsSync(configPath)) {
    src = JSON.parse(fs.readFileSync(configPath).toString());
    spinner.start(`Configuration parsed`);
  } else {
    src = createDefault();
    spinner.fail(`$Configuration ${CLI.colors.url(configPath)} not found`);
    spinner.succeed('Default configuration created');
  }

  if (fs.existsSync(localConfigPath)) {
    curr = JSON.parse(fs.readFileSync(localConfigPath).toString());
  }

  if (filter) {
    spinner.start(`Filtering configuration`);
    dest = filter(src);
  } else {
    dest = src;
  }

  if (!overwrite && curr && !compare(dest, curr)) {
    spinner.start(`Backing up ${CLI.colors.url(localConfigPath)}`);
    spinner.succeed(
      `Backup created at ${CLI.colors.url(backup(localConfigPath))}`
    );
  }

  fs.writeFileSync(localConfigPath, JSON.stringify(dest));
  spinner.succeed(`Configuration synced to ${CLI.colors.url(localConfigPath)}`);

  return dest as Partial<Config>;
}
