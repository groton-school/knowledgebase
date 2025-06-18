import CLI from '@battis/qui-cli';
import { ArrayElement } from '@battis/typescript-tricks';
import { Groups } from '@groton/knowledgebase.config';
import converter from 'json-2-csv';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import * as Users from '../src/Users.js';

await CLI.configure({
  env: {
    root: path.join(import.meta.dirname, '..'),
    loadDotEnv: path.join(import.meta.dirname, '../../../.env')
  }
});
let {
  positionals: [groupsPath, outputPath],
  // eslint-disable-next-line prefer-const
  values: { format, groupFormat, list, pretty }
} = await CLI.init({
  requirePositionals: true,
  opt: {
    format: {
      description: `Output format (default: ${CLI.colors.quotedValue('"csv"')}, ${CLI.colors.quotedValue('"json"')} also supported)`,
      default: 'csv',
      short: 'f'
    },
    groupFormat: {
      description: `Output format for group entries for each user (default: ${CLI.colors.quotedValue('"displayName"')}, alternatives include ${CLI.colors.quotedValue('"email"')}, ${CLI.colors.quotedValue('"groupKey"')}, ${CLI.colors.quotedValue('"name"')}, ${CLI.colors.quotedValue('"boolean"')})`,
      default: 'displayName',
      short: 'g'
    }
  },
  // @ts-expect-error 2322 -- help intentionally not included (will be merged in)
  flag: {
    list: {
      description: `Output groups as a list (default: each group is a field for each user)`,
      short: 'l'
    },
    pretty: {
      description: `Pretty-print output (if applicable, default: ${CLI.colors.value('false')})`,
      short: 'p'
    }
  }
});

format = (format || 'csv').toLowerCase();
Users.setGroupFormat(groupFormat || 'displayName');
const spinner = ora();

spinner.start(`Reading groups from ${CLI.colors.url(groupsPath)}`);
let users: Users.User[] = [];
let groups: Groups;
try {
  groupsPath = path.resolve(process.cwd(), groupsPath!);
  if (!outputPath) {
    outputPath = groupsPath.replace(
      /groups\.json$/,
      format == 'csv' ? 'users.csv' : 'users.json'
    );
  }
  groups = JSON.parse(fs.readFileSync(groupsPath).toString());
} catch (e) {
  spinner.fail(`Could not read groups from ${CLI.colors.url(groupsPath)}`);
  throw e;
}

const subgroups: Users.User[] = [];

for (const group in groups) {
  spinner.start(CLI.colors.quotedValue(`"${group}"`));
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
  spinner.succeed(CLI.colors.quotedValue(`"${group}"`));
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
  spinner.start(CLI.colors.quotedValue(`"${subgroup.user}"`));
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
  spinner.succeed(CLI.colors.quotedValue(`"${subgroup.user}"`));
}
if (subgroups.length > 0) {
  spinner.fail(
    CLI.colors.error(
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

spinner.start(`Writing users to ${CLI.colors.url(outputPath)}`);
fs.writeFileSync(
  outputPath,
  format == 'csv'
    ? converter.json2csv(users)
    : pretty
      ? JSON.stringify(users, null, 2)
      : JSON.stringify(users)
);
spinner.succeed(`Wrote users to ${CLI.colors.url(outputPath)}`);
