import { Group } from '@groton/knowledgebase.config';

export type User = {
  user: string;
  groups?: string[] | string;
} & Record<string, string | boolean>;

type GroupFormat = Exclude<keyof Group, 'members'> | 'email' | 'boolean';

const preceding: Record<string, false | ''> = {};
let groupFormat: GroupFormat;

export function setGroupFormat(format: string) {
  format = format.toLowerCase();
  switch (format) {
    case 'displayname':
      format = 'displayName';
      break;
    case 'groupkey':
      format = 'groupKey';
      break;
    default:
    // leave as is
  }
  groupFormat = format as GroupFormat;
}

export function applyGroupFormat(group: Group, email: string) {
  switch (groupFormat) {
    case 'email':
      return email;
    case 'boolean':
      return true;
    case 'groupKey':
      return group['groupKey'].id;
    default:
      return group[groupFormat];
  }
}

export function append(
  member: string,
  group: string,
  value: boolean | string,
  list: User[]
) {
  const user = list.find((u) => u.user === member);
  if (user) {
    user[group] = value;
  } else {
    list.push({ user: member, ...preceding, [group]: value });
  }
}

export function fill(group: string, list: User[]) {
  preceding[group] = groupFormat === 'boolean' ? false : '';
  for (const user of list) {
    if (user[group] === undefined) {
      user[group] = groupFormat === 'boolean' ? false : '';
    }
  }
}

export function apply(
  subgroup: string,
  group: string,
  value: boolean | string,
  list: User[]
) {
  for (const user of list) {
    if (user[subgroup]) {
      user[group] = value;
    }
  }
}
