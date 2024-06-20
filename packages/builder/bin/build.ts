#!/usr/bin/env tsx
import buildTree from '../src/Actions/buildTree';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOLDER_ID = '%FOLDER_ID%';
const FOLDER_NAME = '%FOLDER_NAME%';
const TIMESTAMP = '%TIMESTAMP%';

const options = {
  folderId: {
    short: 'f',
    description: 'Google Drive ID of folder to index'
  },
  output: {
    short: 'o',
    description: `Output JSON file path (use ${FOLDER_NAME}, ${FOLDER_ID}, and ${TIMESTAMP} placeholders, if so desired)`
  }
};

(async () => {
  const { values } = cli.init({
    env: {
      root: path.join(__dirname, '../..'),
      loadDotEnv: path.join(__dirname, '../../.env')
    },
    args: { options }
  });

  const spinner = cli.spinner();
  spinner.start('Indexing');
  const folderId =
    values.folderId ||
    process.env.ROOT_FOLDER_ID ||
    (await cli.prompts.input({
      message: options.folderId.description,
      validate: cli.validators.notEmpty
    }));
  const tree = await buildTree(folderId, spinner);
  const folderName = Object.keys(tree)[0];
  spinner.succeed(`Indexed ${folderName}`);
  const filePath = (
    values.output ||
    (await cli.prompts.input({
      message: options.output.description,
      default: path.resolve(cli.appRoot(), '../server/var/index.json'),
      validate: cli.validators.notEmpty
    }))
  )
    .replace(FOLDER_ID, folderId)
    .replace(FOLDER_NAME, folderName)
    .replace(TIMESTAMP, new Date().toISOString());
  spinner.start(`Writing index to ${filePath}`);
  const content = JSON.stringify(tree, null, 2);
  fs.writeFileSync(filePath, content);
  spinner.succeed(filePath);
})();
