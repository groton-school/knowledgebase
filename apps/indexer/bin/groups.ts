import cli from '@battis/qui-cli';
import { Groups } from '@groton/knowledgebase.config';
import fs from 'node:fs';
import path from 'node:path';
import config from '../var/config.json';

const defaultFilePath = path.resolve(
  import.meta.dirname,
  '../dist/groups.json'
);

const options = {
  filePath: {
    short: 'f',
    description: `Output JSON file path. If the file already exists, the list will be updated. (defaults to ${cli.colors.url(
      defaultFilePath
    )})`,
    default: defaultFilePath
  },
  permissionsRegex: {
    description: `Regular expression to email addresses of users/groups to include in Cloud Storage Bucket (will be read from ${cli.colors.value(
      'PERMISSIONS_REGEX'
    )} environment variable if present)`
  }
};

(async () => {
  let {
    values: { filePath, permissionsRegex, force }
  } = cli.init({
    args: {
      options,
      flags: {
        force: {
          description: 'Force a sync',
          default: false
        }
      }
    }
  });

  const spinner = cli.spinner();

  const lastSync = process.env.GROUP_SYNC_TIMESTAMP
    ? new Date(parseInt(process.env.GROUP_SYNC_TIMESTAMP))
    : undefined;
  let sync = true;
  if (config.acl?.updateFrequency && lastSync) {
    cli.log.info(`Previously synced ${lastSync.toLocaleString()}`);
    sync = lastSync < new Date(Date.now() - config.acl.updateFrequency * 1000);
  }

  if (sync) {
    const pattern = new RegExp(
      permissionsRegex || process.env.PERMISSIONS_REGEX || '.*'
    );
    let groups: Groups = {};
    let nextPageToken: string | undefined = undefined;
    do {
      const page = JSON.parse(
        cli.shell.exec(
          `gcloud identity groups search --labels="cloudidentity.googleapis.com/groups.${
            process.env.GROUP_TYPE
          }" --customer="${process.env.CUSTOMER}" --project="${
            process.env.PROJECT
          }" --format=json${
            nextPageToken ? ` --page-token="${nextPageToken}"` : ''
          }`
        ).stdout
      );
      for (const group of page.groups) {
        if (pattern.test(group.groupKey.id)) {
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
          cli.shell.exec(
            `gcloud identity groups memberships list --group-email=${group} --project=${
              process.env.PROJECT
            } --format=json --quiet${
              nextPageToken ? ` --page-token="${nextPageToken}"` : ''
            }`
          ).stdout
        );
        groups[group].members.push(
          ...page.map((member) => member.preferredMemberKey.id)
        );
        nextPageToken = page.nextPageToken;
      } while (nextPageToken);
    }

    fs.writeFileSync(filePath, JSON.stringify(groups));
    cli.env.set({ key: 'GROUP_SYNC_TIMESTAMP', value: '' + Date.now() });
    spinner.succeed(`List saved to ${cli.colors.url(filePath)}`);
  } else {
    cli.log.info('No additional sync required at this time');
  }
})();
