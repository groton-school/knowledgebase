import Cache from '../src/Cache';
import Helper from '../src/Helper';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';

// TODO why does reset-permissions need to run separately from upload?
// TODO version of reset-permissions that resets only recent uploads

const defaultIndexPath = path.resolve(__dirname, '../../router/var/index.json');

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
      root: path.join(__dirname, '../../..'),
      loadDotEnv: path.join(__dirname, '../../../.env')
    },
    args: {
      flags,
      options
    }
  });

  const spinner = cli.spinner();

  indexPath = path.resolve(CWD, indexPath);

  Cache.File.event.on(Cache.File.Event.Start, (status) => {
    spinner.start(Helper.colorizeStatus(status));
  });
  Cache.File.event.on(Cache.File.Event.Succeed, (status) =>
    spinner.succeed(Helper.colorizeStatus(status))
  );
  Cache.File.event.on(Cache.File.Event.Fail, (status) =>
    spinner.fail(Helper.colorizeStatus(status))
  );

  spinner.start(`Loading index from ${cli.colors.url(indexPath)}`);
  const index = await Cache.fromFile(indexPath, Cache.File);
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
  for (const file of index) {
    await file.cacheACL({
      bucketName,
      permissionsRegex,
      ignoreErrors: !!ignoreErrors
    });
  }
  spinner.succeed('All permission changes reviewed');

  spinner.start(`Saving index to ${cli.colors.url(indexPath)}`);
  fs.writeFileSync(indexPath, JSON.stringify(index));
  spinner.succeed(`Index saved to ${cli.colors.url(indexPath)}`);
})();
