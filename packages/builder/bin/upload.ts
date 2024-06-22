#!/usr/bin/env tsx
import Folder from '../src/Folder';
import Client from '../src/Google/Client';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  bucket: {
    short: 'b',
    description: 'Google Cloud Storage bucket name'
  },
  index: {
    short: 'i',
    description: 'Path to index file',
    default: path.join(__dirname, '../../server/var/index.json')
  },
  permissionsRegex: {
    short: 'p',
    description:
      'Regular expression to email addresses of users/groups to include in Cloud Storage Bucket'
  },
  keys: {
    short: 'k',
    description: 'Path to file containing downloaded OAuth 2 credentials',
    default: path.join(__dirname, '../var/keys.json')
  },
  tokens: {
    short: 't',
    description: 'Path to file containing access tokens',
    default: path.join(__dirname, '../var/tokens.json')
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
  },
  overwrite: {
    description:
      'Overwrite input file with updated index including upload data (default true, block with --no-overwrite)',
    default: true
  }
};

(async () => {
  const { values } = cli.init({
    env: {
      root: path.join(__dirname, '../../..'),
      loadDotEnv: path.join(__dirname, '../../../.env')
    },
    args: {
      flags,
      options
    }
  });

  Client.init({ keysPath: values.keys, tokensPath: values.tokens });

  const spinner = cli.spinner();

  const indexPath = path.resolve(__dirname, '..', values.index);

  Folder.event.on(Folder.Event.Start, (status) => {
    spinner.start(status);
  });
  Folder.event.on(Folder.Event.Succeed, (status) => spinner.succeed(status));
  Folder.event.on(Folder.Event.Fail, (status) => spinner.fail(status));

  spinner.start(indexPath);
  const folder = await Folder.fromIndexFile(indexPath);
  spinner.succeed(folder.name);

  await folder.cache({
    bucketName:
      values.bucket ||
      process.env.BUCKET ||
      (await cli.prompts.input({
        message: options.bucket.description,
        validate: cli.validators.lengthBetween(6, 30)
      })),
    permissionsRegex:
      values.permissionsRegex || process.env.PERMISSIONS_REGEX || '.*',
    force: !!values.force,
    ignoreErrors: !!values.ignoreErrors
  });

  spinner.start(indexPath);
  fs.writeFileSync(indexPath, JSON.stringify(folder, null, 2));
  spinner.succeed(indexPath);
})();
