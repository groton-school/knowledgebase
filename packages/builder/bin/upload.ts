#!/usr/bin/env tsx
import uploadFile from '../src/Actions/uploadFile';
import uploadFolder from '../src/Actions/uploadFolder';
import { isFile } from '../src/Schema/Folder';
import Tree from '../src/Schema/Tree';
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
  const { values, positionals } = cli.init({
    env: {
      root: path.join(__dirname, '../../..'),
      loadDotEnv: path.join(__dirname, '../../../.env')
    },
    args: {
      requirePositionals: 1,
      flags,
      options
    }
  });

  const spinner = cli.spinner();
  const bucketName =
    values.bucket ||
    process.env.BUCKET ||
    (await cli.prompts.input({
      message: options.bucket.description,
      validate: cli.validators.lengthBetween(6, 30)
    }));

  const indexPath = path.resolve(__dirname, '..', positionals[0]);
  const force = !!values.force;
  const ignoreErrors = !!values.ignoreErrors;

  spinner.start(indexPath);
  const tree: Tree = JSON.parse(fs.readFileSync(indexPath).toString());
  spinner.succeed(indexPath);

  spinner.start(tree.folder['.'].name!);
  for (const fileName of Object.keys(tree.folder)) {
    if (fileName != '.') {
      let file = tree.folder[fileName];
      if (isFile(file)) {
        tree.folder[fileName] = await uploadFile({
          file,
          bucketName,
          force,
          ignoreErrors,
          spinner
        });
      } else {
        tree.folder[fileName] = await uploadFolder({
          folder: file,
          bucketName,
          force,
          ignoreErrors,
          spinner
        });
      }
    }
  }
  spinner.succeed(cli.colors.value(tree.folder['.'].name));
  if (values.overwrite) {
    fs.writeFileSync(indexPath, JSON.stringify(tree, null, 2));
  } else {
    fs.writeFileSync(
      indexPath.replace(new RegExp(`${path.extname(indexPath)}$`), '') +
        '_upload-' +
        new Date().toISOString() +
        '.json',
      JSON.stringify(tree, null, 2)
    );
  }
})();
