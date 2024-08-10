import Cache from '../src/Cache';
import * as Helper from '../src/Helper';
import cli from '@battis/qui-cli';
import Google from '@groton/knowledgebase.google';
import fs from 'fs';
import path from 'path';

const defaultIndexPath = path.resolve(__dirname, '../../router/var/index.json');
const defaultKeysPath = path.resolve(__dirname, '../var/keys.json');
const defaultTokensPath = path.resolve(__dirname, '../var/tokens.json');

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
  keysPath: {
    short: 'k',
    description: `Path to file containing downloaded OAuth2 credentials (defaults to ${cli.colors.url(
      defaultKeysPath
    )})`,
    default: defaultKeysPath
  },
  tokensPath: {
    short: 't',
    description: `Path to file containing access tokens (defaults to ${cli.colors.url(
      defaultTokensPath
    )})`,
    default: defaultTokensPath
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
    values: {
      bucketName,
      indexPath,
      permissionsRegex,
      keysPath,
      tokensPath,
      force,
      ignoreErrors
    }
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

  Google.Client.init({ keysPath, tokensPath });

  const spinner = cli.spinner();

  indexPath = path.resolve(CWD, indexPath);

  Cache.File.event.on(Cache.File.Event.Start, (status) => {
    spinner.start(Helper.colorizePath(status));
  });
  Cache.File.event.on(Cache.File.Event.Succeed, (status) =>
    spinner.succeed(Helper.colorizePath(status))
  );
  Cache.File.event.on(Cache.File.Event.Fail, (status) =>
    spinner.fail(Helper.colorizePath(status))
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

  const updatedIndex = new Cache(index.root);
  for (let i = 0; i < index.length; i++) {
    if (index[i].index.path != '.') {
      const result = await index[i].cache({
        bucketName,
        force: !!force,
        ignoreErrors: !!ignoreErrors
      });
      if (result) {
        updatedIndex.push(result);
      }
    }
  }

  spinner.start(`Saving index to ${cli.colors.url(indexPath)}`);
  fs.writeFileSync(indexPath, JSON.stringify(updatedIndex));
  spinner.succeed(`Index saved to ${cli.colors.url(indexPath)}`);
})();
