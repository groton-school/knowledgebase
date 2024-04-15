#!/usr/bin/env tsx
import FileDescription, { isFileDescription } from '../src/FileDescription';
import FolderDescription from '../src/FolderDescription';
import uploadToBucket from '../src/uploadToBucket';
import cli from '@battis/qui-cli';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const { values, positionals } = cli.init({
  args: {
    requirePositionals: 1,
    options: {
      bucket: {
        short: 'b',
        description: 'Google Cloud Storage bucket name',
        default: process.env.BUCKET_NAME
      }
    }
  }
});

const spinner = cli.spinner();

function rename(fileName: string) {
  return fileName.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

async function uploadTree(subtree: FolderDescription, folderPath: string = '') {
  const folder = subtree['.'];
  const nextPath = path.join(folderPath, rename(folder.name));
  spinner.start(nextPath);
  for (const fileName of Object.keys(subtree)) {
    if (fileName != '.') {
      const file = subtree[fileName];
      if (isFileDescription(file)) {
        await uploadFile(file, nextPath);
      } else {
        await uploadTree(file, nextPath);
      }
    }
  }
  spinner.succeed(cli.colors.url(nextPath));
}

async function uploadFile(file: FileDescription, filePath: string = '') {
  spinner.start(`Uploading ${cli.colors.value(file.name)}`);
  await uploadToBucket({
    file,
    bucketName: process.env.BUCKET_NAME!,
    fileRenamer: (fileName: string) =>
      path.join(
        filePath,
        rename(fileName) + (/\.(png|gif|pdf)$/.test(fileName) ? '' : '.html')
      ),
    fileMutator: (html: string) => {
      return html
        .replace(
          '<style',
          `<meta item-prop="kb.id" content="${file.id}" /><style`
        )
        .replace(
          '</style>',
          `</style><link rel="icon" href="https://storage.cloud.google.com/${values.bucket}/favicon.ico" /><link rel="stylesheet" href="https://storage.cloud.google.com/${values.bucket}/kb.css" />`
        )
        .replace('<body', '<body><div')
        .replace(
          '</body>',
          `</div><script href="https://storage.cloud.google.com/${values.bucket}/kb.js"></script></body>`
        );
    },
    entityFilter: (email: string) => /^kb-.*@groton.org$/.test(email)
  }).then(() => {
    spinner.succeed(
      `${cli.colors.url(`${filePath}/`)}${cli.colors.value(
        rename(file.name) + (/\.(png|gif|pdf)$/.test(file.name) ? '' : '.html')
      )}`
    );
  });
}

(async () => {
  spinner.start(positionals[0]);
  const tree: FolderDescription = JSON.parse(
    fs.readFileSync(positionals[0]).toString()
  );
  spinner.succeed(positionals[0]);

  const rootFolder = Object.keys(tree)[0];
  spinner.start(rootFolder);
  for (const fileName of Object.keys(tree[rootFolder])) {
    if (fileName != '.') {
      const file = (tree[rootFolder] as FolderDescription)[fileName];
      if (isFileDescription(file)) {
        await uploadFile(file);
      } else {
        await uploadTree(file);
      }
    }
  }
  spinner.succeed(cli.colors.url(rootFolder));
})();
