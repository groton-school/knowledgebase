import { ArrayElement } from '@battis/typescript-tricks';
import { Groups } from '@groton/knowledgebase.config';
import { Colors } from '@qui-cli/colors';
import { Positionals } from '@qui-cli/core';
import { Env } from '@qui-cli/env-1password';
import * as Plugin from '@qui-cli/plugin';
import converter from 'json-2-csv';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import * as Users from '../Users.js';

export type Configuration = Plugin.Configuration & {
  format?: 'csv' | 'json';
  groupFormat?: string;
  list?: boolean;
  pretty?: boolean;
};

const CWD = process.cwd();

export const name = 'users';

let format = 'csv';
let groupFormat = 'displayName';
let list = false;
let pretty = false;

export function configure(config: Configuration = {}) {
  format = Plugin.hydrate(config.format, format).toLowerCase();
  groupFormat = Plugin.hydrate(config.groupFormat, groupFormat);
  list = Plugin.hydrate(config.list, list);
  pretty = Plugin.hydrate(config.pretty, pretty);
}

export function options(): Plugin.Options {
  Positionals.require({ groupsPath: {}, outputPath: {} });
  Positionals.allowOnlyNamedArgs();
  return {
    opt: {
      format: {
        description: `Output format (default: ${Colors.quotedValue(`"${format}"`)}, ${Colors.quotedValue(
          '"json"'
        )} also supported)`,
        default: format,
        short: 'f'
      },
      groupFormat: {
        description: `Output format for group entries for each user (default: ${Colors.quotedValue(
          '"displayName"'
        )}, alternatives include ${['email', 'groupKey', 'name']
          .map((f) => Colors.quotedValue(`"${f}"`))
          .join(', ')})`,
        default: 'displayName',
        short: 'g'
      }
    },
    flag: {
      list: {
        description: `Output groups as a list (default: each group is a field for each user)`,
        short: 'l'
      },
      pretty: {
        description: `Pretty-print output (if applicable, default: ${Colors.value('false')})`,
        short: 'p'
      }
    }
  };
}

export async function init({
  values
}: Plugin.ExpectedArguments<typeof options>) {
  await Env.configure({
    root: path.join(import.meta.dirname, '..'),
    loadDotEnv: path.join(import.meta.dirname, '../../../../.env')
  });
  configure(values);
}

export async function run() {
  Users.setGroupFormat(groupFormat);
  let groupsPath = Positionals.get('groupsPath');
  let outputPath = Positionals.get('outputPath');

  const spinner = ora();

  spinner.start(`Reading groups from ${Colors.url(groupsPath)}`);
  let users: Users.User[] = [];
  let groups: Groups;
  try {
    groupsPath = path.resolve(CWD, groupsPath!);
    if (!outputPath) {
      outputPath = groupsPath.replace(
        /groups\.json$/,
        format == 'csv' ? 'users.csv' : 'users.json'
      );
    }
    groups = JSON.parse(fs.readFileSync(groupsPath).toString());
  } catch (e) {
    spinner.fail(`Could not read groups from ${Colors.url(groupsPath)}`);
    throw e;
  }

  const subgroups: Users.User[] = [];

  for (const group in groups) {
    spinner.start(Colors.quotedValue(`"${group}"`));
    for (const member of groups[group].members || []) {
      if (member in groups) {
        Users.append(
          member,
          group,
          Users.applyGroupFormat(groups[group], group),
          subgroups
        );
      } else {
        Users.append(
          member,
          group,
          Users.applyGroupFormat(groups[group], group),
          users
        );
      }
      Users.fill(group, users);
      Users.fill(group, subgroups);
    }
    spinner.succeed(Colors.quotedValue(`"${group}"`));
  }

  spinner.start(`Processing subgroups`);
  let i: number;
  while (
    (i = subgroups.findIndex((subgroup) =>
      Object.keys(subgroup)
        .filter((k) => k !== 'user' && subgroup[k])
        .reduce(
          (independent, group) =>
            independent && !subgroups.find((g) => g.user === group),
          true
        )
    )) >= 0
  ) {
    const subgroup = subgroups[i];
    subgroups.splice(i, 1);
    spinner.start(Colors.quotedValue(`"${subgroup.user}"`));
    for (const group of Object.keys(subgroup).filter((k) => k !== 'user')) {
      if (subgroup[group]) {
        Users.apply(
          subgroup.user,
          group,
          Users.applyGroupFormat(groups[group], group),
          users
        );
        Users.apply(
          subgroup.user,
          group,
          Users.applyGroupFormat(groups[group], group),
          subgroups
        );
      }
    }
    spinner.succeed(Colors.quotedValue(`"${subgroup.user}"`));
  }
  if (subgroups.length > 0) {
    spinner.fail(
      Colors.error(
        `${subgroups.length} circular dependencies found in subgroups`
      )
    );
    throw new Error(
      JSON.stringify(
        subgroups.map((g) =>
          Object.keys(g).reduce(
            (f, k) => {
              if (g[k]) {
                f[k] = g[k];
              }
              return f;
            },
            {} as ArrayElement<typeof users>
          )
        ),
        null,
        2
      )
    );
  }

  if (list) {
    users = users.map(
      (user) =>
        ({
          user: user.user,
          groups: Object.keys(user).reduce((values, key) => {
            if (key != 'user' && user[key] && user[key] !== '') {
              values.push(user[key] === true ? key : user[key].toString());
            }
            return values;
          }, [] as string[])
        }) as Users.User
    );

    if (format == 'csv') {
      users = users.map((user) => {
        user.groups = Array.isArray(user.groups)
          ? user.groups.join(',')
          : user.groups;
        return user;
      });
    }
  }

  spinner.start(`Writing users to ${Colors.url(outputPath)}`);
  fs.writeFileSync(
    outputPath,
    format == 'csv'
      ? converter.json2csv(users)
      : pretty
        ? JSON.stringify(users, null, 2)
        : JSON.stringify(users)
  );
  spinner.succeed(`Wrote users to ${Colors.url(outputPath)}`);
}
