#!/usr/bin/env tsx
import folderContents from '../src/folderContents';
import cli from '@battis/qui-cli';
import dotenv from 'dotenv';
import fs from 'fs';

const FOLDER_ID = '%FOLDER_ID%';
const FOLDER_NAME = '%FOLDER_NAME%';
const TIMESTAMP = '%TIMESTAMP%';

(async () => {
  dotenv.config();
  const { values } = cli.init({
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
          default: '%FOLDER_NAME%_%TIMESTAMP%.json'
        }
      }
    }
  });
  const spinner = cli.spinner();
  spinner.start('Indexing');
  const tree = await folderContents(values.folderId, spinner);
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
