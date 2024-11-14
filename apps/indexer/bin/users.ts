import cli from '@battis/qui-cli';
import { ArrayElement } from '@battis/typescript-tricks';
import { Groups } from '@groton/knowledgebase.config';
import converter from 'json-2-csv';
import fs from 'node:fs';
import path from 'node:path';
import * as Users from '../src/Users.js';

let {
  positionals: [groupsPath, outputPath],
  values: { format, groupFormat, list, pretty }
} = cli.init({
  env: {
    root: path.join(import.meta.dirname, '..'),
    loadDotEnv: path.join(import.meta.dirname, '../../../.env')
  },
  args: {
    requirePositionals: true,
    options: {
      format: {
        description: `Output format (default: ${cli.colors.quotedValue('"csv"')}, ${cli.colors.quotedValue('"json"')} also supported)`,
        default: 'csv',
        short: 'f'
      },
      groupFormat: {
        description: `Output format for group entries for each user (default: ${cli.colors.quotedValue('"displayName"')}, alternatives include ${cli.colors.quotedValue('"email"')}, ${cli.colors.quotedValue('"groupKey"')}, ${cli.colors.quotedValue('"name"')}, ${cli.colors.quotedValue('"boolean"')})`,
        default: 'displayName',
        short: 'g'
      }
    },
    flags: {
      list: {
        description: `Output groups as a list (default: each group is a field for each user)`,
        short: 'l'
      },
      pretty: {
        description: `Pretty-print output (if applicable, default: ${cli.colors.value('false')})`,
        short: 'p'
      }
    }
  }
});

format = format.toLowerCase();
Users.setGroupFormat(groupFormat);
const spinner = cli.spinner();

spinner.start(`Reading groups from ${cli.colors.url(groupsPath)}`);
let users: Users.User[] = [];
let groups: Groups;
try {
  groupsPath = path.resolve(process.cwd(), groupsPath);
  if (!outputPath) {
    outputPath = groupsPath.replace(
      /groups\.json$/,
      format == 'csv' ? 'users.csv' : 'users.json'
    );
  }
  groups = JSON.parse(fs.readFileSync(groupsPath).toString());
} catch (e) {
  spinner.fail(`Could not read groups from ${cli.colors.url(groupsPath)}`);
  throw e;
}

let subgroups: Users.User[] = [];

for (const group in groups) {
  spinner.start(cli.colors.quotedValue(`"${group}"`));
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
  spinner.succeed(cli.colors.quotedValue(`"${group}"`));
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
  spinner.start(cli.colors.quotedValue(`"${subgroup.user}"`));
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
  spinner.succeed(cli.colors.quotedValue(`"${subgroup.user}"`));
}
if (subgroups.length > 0) {
  spinner.fail(
    cli.colors.error(
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
  users = users.map((user) => ({
    user: user.user,
    groups: Object.keys(user).reduce((values, key) => {
      if (key != 'user' && user[key] && user[key] !== '') {
        values.push(user[key] === true ? key : user[key].toString());
      }
      return values;
    }, [] as string[])
  }));

  if (format == 'csv') {
    users = users.map((user) => {
      user.groups = Array.isArray(user.groups)
        ? user.groups.join(',')
        : user.groups;
      return user;
    });
  }
}

spinner.start(`Writing users to ${cli.colors.url(outputPath)}`);
fs.writeFileSync(
  outputPath,
  format == 'csv'
    ? converter.json2csv(users)
    : pretty
      ? JSON.stringify(users, null, 2)
      : JSON.stringify(users)
);
spinner.succeed(`Wrote users to ${cli.colors.url(outputPath)}`);
