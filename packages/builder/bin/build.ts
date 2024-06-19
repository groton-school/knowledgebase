#!/usr/bin/env tsx
import buildTree from '../src/Actions/buildTree';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';

const FOLDER_ID = '%FOLDER_ID%';
const FOLDER_NAME = '%FOLDER_NAME%';
const TIMESTAMP = '%TIMESTAMP%';

(async () => {
  const { values } = cli.init({
    env: { root: process.cwd() },
    args: {
      options: {
        folderId: {
          short: 'f',
          description: 'Google Drive ID of folder to index',
          default: process.env.ROOT_FOLDER_ID
        },
        output: {
          short: 'o',
          description: `Output JSON file path (use ${FOLDER_NAME}, ${FOLDER_ID}, and ${TIMESTAMP} placeholders, if so desired)`,
          default: path.join(cli.appRoot(), '../server/var/index.json')
        }
      }
    }
  });
  const spinner = cli.spinner();
  spinner.start('Indexing');
  const tree = await buildTree(values.folderId, spinner);
  const folderName = Object.keys(tree)[0];
  spinner.succeed(`Indexed ${folderName}`);
  const filePath = values.output
    .replace(FOLDER_ID, values.folderId)
    .replace(FOLDER_NAME, folderName)
    .replace(TIMESTAMP, new Date().toISOString());
  spinner.start(`Writing index to ${filePath}`);
  const content = JSON.stringify(tree, null, 2);
  fs.writeFileSync(filePath, content);
  spinner.succeed(filePath);
})();
