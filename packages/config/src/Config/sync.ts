import Config from './Config';
import createDefault from './createDefault';
import cli from '@battis/qui-cli';
import { JSONObject } from '@battis/typescript-tricks';
import fs from 'fs';
import path from 'path';

function backup(targetPath: string) {
  let backupPath: string = targetPath;
  for (let counter = 1; fs.existsSync(backupPath); counter++) {
    backupPath = targetPath.replace(/(\.\w+)$/, `.${counter}$1`);
  }
  cli.shell.mv(targetPath, backupPath);
  return backupPath;
}

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

export default function sync(
  {
    env
  }: {
    env: { root: string; loadDotEnv?: string };
  },
  filter?: (config: JSONObject) => JSONObject
) {
  const defaultConfigPath = path.resolve(env.root, 'var/config.json');
  const args = {
    options: {
      configPath: {
        short: 'c',
        description: `Path to the configuration file, relative to package root (default ${cli.colors.url(
          defaultConfigPath
        )})`,
        default: defaultConfigPath
      }
    },
    flags: {
      overwrite: {
        short: 'o',
        description:
          'Overwrite any existing local configuration file (if false, sequential backups are made)',
        default: false
      }
    }
  };

  let {
    values: { configPath, overwrite, verify }
  } = cli.init({
    env,
    args
  });

  configPath = path.resolve(env.root, configPath);
  const localConfigPath = args.options.configPath.default;

  const spinner = cli.spinner();
  spinner.start(`Seeking configuration ${cli.colors.url(configPath)}`);

  let src: JSONObject,
    dest: JSONObject,
    curr: object | undefined = undefined;

  if (fs.existsSync(configPath)) {
    src = JSON.parse(fs.readFileSync(configPath).toString());
    spinner.start(`Configuration parsed`);
  } else {
    src = createDefault();
    spinner.fail(`$Configuration ${cli.colors.url(configPath)} not found`);
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

  if (!!!overwrite && curr && !compare(dest, curr)) {
    spinner.start(`Backing up ${cli.colors.url(localConfigPath)}`);
    spinner.succeed(
      `Backup created at ${cli.colors.url(backup(localConfigPath))}`
    );
  }

  fs.writeFileSync(localConfigPath, JSON.stringify(dest));
  spinner.succeed(`Configuration synced to ${cli.colors.url(localConfigPath)}`);

  return dest as Partial<Config>;
}
