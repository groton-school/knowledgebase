#!/usr/bin/env tsx
import File from '../src/File';
import Folder from '../src/Folder';
import Client from '../src/Google/Client';
import MimeTypes from '../src/MimeTypes';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  permissionsRegex: {
    short: 'p',
    description: `Regular expression to email addresses of users/groups to include in Cloud Storage Bucket (will be read from ${cli.colors.value(
      'PERMISSIONS_REGEX'
    )} environment variable if present)`
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

  Client.init({ keysPath, tokensPath });

  const spinner = cli.spinner();

  indexPath = path.resolve(CWD, indexPath);

  Folder.event.on(Folder.Event.Start, (status) => {
    spinner.start(status);
  });
  Folder.event.on(Folder.Event.Succeed, (status) => spinner.succeed(status));
  Folder.event.on(Folder.Event.Fail, (status) => spinner.fail(status));

  spinner.start(`Loading index from ${cli.colors.url(indexPath)}`);
  const index: (File | Folder)[] = await Promise.all(
    JSON.parse(fs.readFileSync(indexPath).toString()).map((obj: File) => {
      if (obj.mimeType == MimeTypes.Google.Folder) {
        return Folder.fromDrive(obj, obj.index);
      } else {
        return File.fromDrive(obj, obj.index);
      }
    })
  );
  spinner.succeed(`${cli.colors.value(index[0].name)} index loaded`);

  bucketName =
    bucketName ||
    process.env.BUCKET ||
    (await cli.prompts.input({
      message: options.bucketName.description,
      validate: cli.validators.lengthBetween(6, 30)
    }));

  for (let i = 0; i < index.length; i++) {
    await index[i].cache({
      bucketName,
      permissionsRegex:
        permissionsRegex || process.env.PERMISSIONS_REGEX || '.*',
      force: !!force,
      ignoreErrors: !!ignoreErrors
    });
  }

  spinner.start(`Saving index to ${cli.colors.url(indexPath)}`);
  fs.writeFileSync(indexPath, JSON.stringify(index));
  spinner.succeed(`Index saved to ${cli.colors.url(indexPath)}`);
})();
