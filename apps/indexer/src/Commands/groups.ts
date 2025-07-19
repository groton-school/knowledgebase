import { PathString } from '@battis/descriptive-types';
import { Colors } from '@battis/qui-cli.colors';
import { Env } from '@battis/qui-cli.env';
import { Log } from '@battis/qui-cli.log';
import * as Plugin from '@battis/qui-cli.plugin';
import { Shell } from '@battis/qui-cli.shell';
import { Groups } from '@groton/knowledgebase.config';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';

type GroupType = 'discussion_forum' | 'security' | 'posix' | 'dynamic';

export type Configuration = Plugin.Configuration & {
  filePath?: PathString;
  customer?: string;
  project?: string;
  groupType?: GroupType;
  permissionsRegex?: string | RegExp;
  force?: boolean;
};

const PERMISSIONS_REGEX = 'PERMISSIONS_REGEX';
const GROUP_SYNC_TIMESTAMP = 'GROUP_SYNC_TIMESTAMP';
const GROUP_TYPE = 'GROUP_TYPE';
const CUSTOMER = 'CUSTOMER';
const PROJECT = 'PROJECT';

const config = JSON.parse(
  fs
    .readFileSync(path.resolve(import.meta.dirname, '../../var/config.json'))
    .toString()
);

export const name = 'groups';

let filePath = path.resolve(import.meta.dirname, '../../dist/groups.json');
let customer: string | undefined = undefined;
let project: string | undefined = undefined;
let groupType: GroupType = 'discussion_forum';
let permissionsRegex = /.*/;
let force = false;

export function configure(config: Configuration = {}) {
  filePath = Plugin.hydrate(config.filePath, filePath);
  customer = Plugin.hydrate(config.customer, customer);
  project = Plugin.hydrate(config.project, project);
  groupType = Plugin.hydrate(config.groupType, groupType);
  if (config.permissionsRegex) {
    if (config.permissionsRegex instanceof RegExp) {
      permissionsRegex = config.permissionsRegex;
    } else {
      permissionsRegex = new RegExp(config.permissionsRegex);
    }
  }
  force = Plugin.hydrate(config.force, force);
}

export function options(): Plugin.Options {
  return {
    opt: {
      filePath: {
        short: 'f',
        description: `Output JSON file path. If the file already exists, the list will be updated. (defaults to ${Colors.url(
          filePath
        )})`,
        default: filePath
      },
      customer: {
        description: `Google Workspace customer ID (will be read from ${Colors.value(CUSTOMER)} environment variable if present)`
      },
      project: {
        description: `Google Cloud project ID with Google Cloud Identity API access (will be read from ${Colors.value(
          PROJECT
        )} environment variable if present)`
      },
      groupType: {
        description: `Google Group type to search form (default: ${Colors.value(
          groupType
        )}, options are: ${['discussion_forum', 'security', 'posix', 'dynamic']
          .map((t) => Colors.value(t))
          .join(
            ', '
          )}, will be read from ${Colors.value(GROUP_TYPE)} environment variable if present)`
      },
      permissionsRegex: {
        description: `Regular expression to email addresses of users/groups to include in Cloud Storage Bucket (will be read from ${Colors.value(
          PERMISSIONS_REGEX
        )} environment variable if present)`
      }
    },
    flag: {
      force: {
        description: 'Force a sync',
        default: false
      }
    },
    man: [
      {
        text: `Groups are only periodically synced. Frequency is set in ${Colors.url(
          path.resolve(import.meta.dirname, '../../var/config.json')
        )} in the ${Colors.value('acl.updateFrequency')} property and the most recent sync time stamp is stored in the ${Colors.value(
          GROUP_SYNC_TIMESTAMP
        )} environment variable.`
      }
    ]
  };
}

export async function init({
  values
}: Plugin.ExpectedArguments<typeof options>) {
  const { permissionsRegex, customer, project, groupType, ...rest } = values;
  await Env.configure({
    root: path.join(import.meta.dirname, '../../../..'),
    loadDotEnv: path.join(import.meta.dirname, '../../../../.env')
  });
  configure({
    customer: customer || process.env[CUSTOMER],
    project: project || process.env[PROJECT],
    groupType: groupType || process.env[GROUP_TYPE],
    permissionsRegex: permissionsRegex || process.env[PERMISSIONS_REGEX],
    ...rest
  });
}

export async function run() {
  const spinner = ora();

  const lastSync = process.env[GROUP_SYNC_TIMESTAMP]
    ? new Date(parseInt(process.env[GROUP_SYNC_TIMESTAMP]))
    : undefined;
  let sync = true;
  if (config.acl?.updateFrequency && lastSync) {
    Log.info(`Previously synced ${lastSync.toLocaleString()}`);
    sync = lastSync < new Date(Date.now() - config.acl.updateFrequency * 1000);
  }

  if (sync) {
    const groups: Groups = {};
    let nextPageToken: string | undefined = undefined;
    do {
      const page = JSON.parse(
        Shell.exec(
          `gcloud identity groups search --labels="cloudidentity.googleapis.com/groups.${
            groupType
          }" --customer="${customer}" --project="${project}" --format=json${
            nextPageToken ? ` --page-token="${nextPageToken}"` : ''
          }`
        ).stdout
      );
      for (const group of page.groups) {
        if (permissionsRegex.test(group.groupKey.id)) {
          groups[group.groupKey.id] = group;
        }
      }
      nextPageToken = page.nextPageToken;
    } while (nextPageToken);

    for (const group in groups) {
      groups[group].members = [];
      nextPageToken = undefined;
      do {
        const page = JSON.parse(
          Shell.exec(
            `gcloud identity groups memberships list --group-email=${group} --project=${
              project
            } --format=json --quiet${
              nextPageToken ? ` --page-token="${nextPageToken}"` : ''
            }`
          ).stdout
        ) as {
          preferredMemberKey: { id: string };
        }[] & { nextPageToken?: string };
        groups[group].members.push(
          ...page.map((member) => member.preferredMemberKey.id)
        );
        nextPageToken = page.nextPageToken;
      } while (nextPageToken);
    }

    fs.writeFileSync(filePath, JSON.stringify(groups));
    Env.set({ key: 'GROUP_SYNC_TIMESTAMP', value: '' + Date.now() });
    spinner.succeed(`List saved to ${Colors.url(filePath)}`);
  } else {
    Log.info('No additional sync required at this time');
  }
}
