#!/usr/bin/env tsx
import uploadToBucket, {
  stripNonAlphanumeric,
  fetchAsHtml
} from './Actions/uploadToBucket';
import FolderDescription, { FileDescription } from './Models/FolderDescription';
import cli from '@battis/qui-cli';
import dotenv from 'dotenv';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { google, drive_v3 } from 'googleapis';
import path from 'path';

dotenv.config();
const { values, positionals } = cli.init({
  env: { root: process.cwd() },
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
const bucketName = values.bucket;

async function fetchAsHtmlIfPossible(
  file: FileDescription,
  auth: OAuth2Client
) {
  switch (file.mimeType) {
    case 'image/png':
    case 'image/gif':
    case 'application/pdf':
      const drive = google.drive({ version: 'v3', auth });
      return (await drive.files.get({
        fileId: file.id!,
        alt: 'media'
      })) as unknown as Blob;
    default:
      return await fetchAsHtml(file, auth);
  }
}

function fileRenamer(filePath: string, file: FileDescription) {
  switch (file.fileExtension) {
    case 'gif':
    case 'png':
    case 'pdf':
      return path.join(filePath, file.name!);
    default:
      return path.join(filePath, `${stripNonAlphanumeric(file)}/index.html`);
  }
}

async function demoteBodyToDiv(
  file: FileDescription,
  blob: Blob
): Promise<Blob> {
  const html = await blob.text();
  return new Blob(
    [
      html
        .replace(
          '<style',
          `<meta item-prop="kb.id" content="${file.id}" /><style`
        )
        .replace(
          '</style>',
          `</style><link rel="icon" href="https://storage.cloud.google.com/${bucketName}/favicon.ico" /><link rel="stylesheet" href="https://storage.cloud.google.com/${bucketName}/kb.css" />`
        )
        .replace('<body', '<body><div')
        .replace(
          '</body>',
          `</div><script href="https://storage.cloud.google.com/${bucketName}/kb.js"></script></body>`
        )
    ],
    { type: 'text/html' }
  );
}

function onlyKbPermissionGroups(
  permission: drive_v3.Schema$Permission
): boolean {
  return /^kb-.*@groton.org$/.test(permission.emailAddress!);
}

function isFileDescription(obj: object): obj is FileDescription {
  return !('.' in obj);
}

async function uploadTree(subtree: FolderDescription, folderPath: string = '') {
  const folder = subtree['.'];
  const nextPath = path.join(folderPath, stripNonAlphanumeric(folder));
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
    bucketName,
    fileFetcher: fetchAsHtmlIfPossible,
    fileNamer: fileRenamer.bind(null, filePath),
    fileMutator: demoteBodyToDiv.bind(null, file),
    permissionsFilter: onlyKbPermissionGroups
  }).then(() => {
    spinner.succeed(
      `${cli.colors.url(`${filePath}/`)}${cli.colors.value(
        fileRenamer('', file)
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
