import cli from '@battis/qui-cli';
import Google from '@groton/knowledgebase.google';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';
import Cache from '../src/Cache/index.js';
import Helper from '../src/Helper/index.js';

const defaultIndexPath = path.resolve(
  import.meta.dirname,
  '../dist/index.json'
);
const defaultKeysPath = path.resolve(import.meta.dirname, '../var/keys.json');
const defaultTokensPath = path.resolve(
  import.meta.dirname,
  '../var/tokens.json'
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
  },
  chunkSize: {
    description: `Number of files to simultaneously cache (defaults to ${cli.colors.value(25)})`,
    default: '25'
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
      keysPath,
      tokensPath,
      force,
      ignoreErrors,
      chunkSize: _chunkSize
    }
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
  const chunkSize = parseInt(_chunkSize);

  Google.Client.init({ keysPath, tokensPath });

  const spinner = ora();
  Cache.File.bindSpinner(spinner, Helper.colorizeStatus);

  indexPath = path.resolve(CWD, indexPath);

  spinner.start(`Loading index from ${cli.colors.url(indexPath)}`);
  const index = await Cache.fromFile(indexPath);
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

  spinner.start('Reviewing index files');
  for (let i = 0; i < index.length; i += chunkSize) {
    await Promise.allSettled(
      index.slice(i, i + chunkSize).map((entry) => {
        if (entry.index.path != '.') {
          return entry.cache({
            bucketName,
            force: !!force,
            ignoreErrors: !!ignoreErrors
          });
        }
      })
    );
  }
  const updatedIndex = index.filter(
    (entry) =>
      !(
        entry.index.exists === false &&
        entry.index.status === Cache.IndexEntry.State.Expired
      )
  );
  spinner.succeed('All indexed files reviewed');

  spinner.start(`Saving index to ${cli.colors.url(indexPath)}`);
  fs.writeFileSync(indexPath, JSON.stringify(updatedIndex));
  spinner.succeed(`Index saved to ${cli.colors.url(indexPath)}`);
})();
