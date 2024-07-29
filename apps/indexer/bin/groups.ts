import cli from '@battis/qui-cli';
import Var from '@groton/knowledgebase.config';
import fs from 'fs';
import path from 'path';

const defaultFilePath = path.resolve(__dirname, '../../router/var/groups.json');

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
    values: { filePath, permissionsRegex }
  } = cli.init({ args: { options } });

  const spinner = cli.spinner();

  let groups: Var.Groups = [];
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
    groups.push(...page.groups);
    nextPageToken = page.nextPageToken;
  } while (nextPageToken);
  const pattern = new RegExp(
    permissionsRegex || process.env.PERMISSIONS_REGEX || '.*'
  );

  fs.writeFileSync(
    filePath,
    JSON.stringify(groups.filter((group) => pattern.test(group.groupKey.id)))
  );
  spinner.succeed(`List saved to ${cli.colors.url(filePath)}`);
})();
