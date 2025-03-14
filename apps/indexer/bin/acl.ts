import cli from '@battis/qui-cli';
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

const options = {
  bucketName: {
    short: 'b',
    description: `Google Cloud Storage bucket name (will be read from ${cli.colors.value(
      'BUCKET'
    )} environment variable if present)`
  },
  indexPath: {
    short: 'i',
    description: `Path to index file (defaults to ${cli.colors.url(
      defaultIndexPath
    )})`,
    default: defaultIndexPath
  },
  permissionsRegex: {
    short: 'p',
    description: `Regular expression to email addresses of users/groups to include in Cloud Storage Bucket (will be read from ${cli.colors.value(
      'PERMISSIONS_REGEX'
    )} environment variable if present, defaults to ${cli.colors.value(
      '.*'
    )} if no argument or environment variable is present)`
  }
};

const flags = {
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
  let {
    values: { bucketName, indexPath, permissionsRegex, force, ignoreErrors }
  } = cli.init({
    env: {
      root: path.join(import.meta.dirname, '../../..'),
      loadDotEnv: path.join(import.meta.dirname, '../../../.env')
    },
    args: {
      flags,
      options
    }
  });

  const spinner = ora();
  ACL.File.bindSpinner(spinner, Helper.colorizeStatus);

  indexPath = path.resolve(CWD, indexPath);

  spinner.start(`Loading index from ${cli.colors.url(indexPath)}`);
  const index = await ACL.fromFile(indexPath);
  if (!index.root) {
    spinner.fail(
      `Missing root path in ${cli.colors.url(path.dirname(indexPath))}/${cli.colors.value(path.basename(indexPath))}`
    );
    process.exit(1);
  }
  spinner.succeed(`${cli.colors.value(index.root.name)} index loaded`);

  bucketName =
    bucketName ||
    process.env.BUCKET ||
    (await cli.prompts.input({
      message: options.bucketName.description,
      validate: cli.validators.lengthBetween(6, 30)
    }));

  permissionsRegex = permissionsRegex || process.env.PERMISSIONS_REGEX || '.*';

  spinner.start('Reviewing permission changes');
  await Promise.allSettled(
    index.map((file) =>
      file.cache({ bucketName, permissionsRegex, ignoreErrors: !!ignoreErrors })
    )
  );
  spinner.succeed('All permission changes reviewed');

  spinner.start(`Saving index to ${cli.colors.url(indexPath)}`);
  fs.writeFileSync(indexPath, JSON.stringify(index));
  spinner.succeed(`Index saved to ${cli.colors.url(indexPath)}`);
})();
