import CLI from '@battis/qui-cli';
import { input } from '@inquirer/prompts';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import ACL from '../src/ACL/index.js';
import Helper from '../src/Helper/index.js';

// TODO why does reset-permissions need to run separately from upload?
// TODO version of reset-permissions that resets only recent uploads

const defaultIndexPath = path.resolve(
  import.meta.dirname,
  '../dist/index.json'
);

const opt = {
  bucketName: {
    short: 'b',
    description: `Google Cloud Storage bucket name (will be read from ${CLI.colors.value(
      'BUCKET'
    )} environment variable if present)`
  },
  indexPath: {
    short: 'i',
    description: `Path to index file (defaults to ${CLI.colors.url(
      defaultIndexPath
    )})`,
    default: defaultIndexPath
  },
  permissionsRegex: {
    short: 'p',
    description: `Regular expression to email addresses of users/groups to include in Cloud Storage Bucket (will be read from ${CLI.colors.value(
      'PERMISSIONS_REGEX'
    )} environment variable if present, defaults to ${CLI.colors.value(
      '.*'
    )} if no argument or environment variable is present)`
  }
};

const flag = {
  force: {
    short: 'f',
    description: 'Force upload of all files, ignoring current index status',
    default: false
  },
  ignoreErrors: {
    description:
      'Ignore errors and continue uploading (default true, stop on errors with --no-ignore-errors',
    default: true
  }
};

(async () => {
  const CWD = process.cwd();
  await CLI.configure({
    env: {
      root: path.join(import.meta.dirname, '../../..'),
      loadDotEnv: path.join(import.meta.dirname, '../../../.env')
    }
  });
  let {
    // eslint-disable-next-line prefer-const
    values: { bucketName, indexPath, permissionsRegex, ignoreErrors }
  } = await CLI.init({
    flag,
    opt
  });

  const spinner = ora();
  ACL.File.bindSpinner(spinner, Helper.colorizeStatus);

  indexPath = path.resolve(CWD, indexPath || defaultIndexPath);

  spinner.start(`Loading index from ${CLI.colors.url(indexPath)}`);
  const index = await ACL.fromFile(indexPath);
  if (!index.root) {
    spinner.fail(
      `Missing root path in ${CLI.colors.url(path.dirname(indexPath))}/${CLI.colors.value(path.basename(indexPath))}`
    );
    process.exit(1);
  }
  spinner.succeed(`${CLI.colors.value(index.root.name)} index loaded`);

  bucketName =
    bucketName ||
    process.env.BUCKET ||
    (await input({
      message: opt.bucketName.description,
      validate: CLI.validators.lengthBetween(6, 30)
    }));

  permissionsRegex = permissionsRegex || process.env.PERMISSIONS_REGEX || '.*';

  spinner.start('Reviewing permission changes');
  await Promise.allSettled(
    index.map((file) =>
      file.cache({ bucketName, permissionsRegex, ignoreErrors: !!ignoreErrors })
    )
  );
  spinner.succeed('All permission changes reviewed');

  spinner.start(`Saving index to ${CLI.colors.url(indexPath)}`);
  fs.writeFileSync(indexPath, JSON.stringify(index));
  spinner.succeed(`Index saved to ${CLI.colors.url(indexPath)}`);
})();
