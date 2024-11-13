import cli from '@battis/qui-cli';
import converter from 'json-2-csv';
import fs from 'node:fs';
import path from 'node:path';

// https://stackoverflow.com/a/51399781/294171
type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

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
groupFormat = groupFormat.toLowerCase();
switch (groupFormat) {
  case 'displayname':
    groupFormat = 'displayName';
    break;
  case 'groupkey':
    groupFormat = 'groupKey';
    break;
  default:
  // leave as is
}
const spinner = cli.spinner();

spinner.start(`Reading groups from ${cli.colors.url(groupsPath)}`);
let users: ({ user: string } & Record<string, boolean | string>)[] = [];
let groups: Record<
  string,
  { displayName: string; groupKey: string; name: string; members: string[] }
>;
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
console.log({ groupsPath, outputPath, format, groupFormat, list });

const preceding: Record<string, false> = {};
let subgroups: typeof users = [];

function append(
  member: string,
  group: string,
  value: boolean | string,
  list: typeof users
) {
  const user = list.find((u) => u.user === member);
  if (user) {
    user[group] = value;
  } else {
    list.push({ user: member, ...preceding, [group]: value });
  }
}

function fill(group: string, list: typeof users) {
  for (const user of list) {
    if (user[group] === undefined) {
      user[group] = groupFormat === 'boolean' ? false : '';
    }
  }
}

function apply(
  subgroup: string,
  group: string,
  value: boolean | string,
  list: typeof users
) {
  for (const user of users) {
    if (user[subgroup]) {
      user[group] = value;
    }
  }
}

for (const group in groups) {
  spinner.start(cli.colors.quotedValue(`"${group}"`));
  for (const member of groups[group].members) {
    if (member in groups) {
      append(
        member,
        group,
        groupFormat === 'email' ? 'group' : groups[group][groupFormat],
        subgroups
      );
    } else {
      append(
        member,
        group,
        groupFormat === 'email' ? 'group' : groups[group][groupFormat],
        users
      );
    }
    fill(group, users);
    fill(group, subgroups);
    preceding[group] = groupFormat === 'boolean' ? false : '';
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
      apply(
        subgroup.user,
        group,
        groupFormat === 'email' ? 'group' : groups[group][groupFormat],
        users
      );
      apply(
        subgroup.user,
        group,
        groupFormat === 'email' ? 'group' : groups[group][groupFormat],
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
        values.push(user[key] === true ? key : user[key]);
      }
      return values;
    }, [] as string[])
  }));

  if (format == 'csv') {
    users = users.map((user) => {
      user.groups = user.groups.join(',');
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
