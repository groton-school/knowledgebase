#!/usr/bin/env tsx
import uploadToBucket, {
  stripNonAlphanumeric,
  fetchAsCompleteHtml
} from '../src/Actions/uploadToBucket';
import FolderDescription, {
  FileDescription,
  isFileDescription
} from '../src/Models/FolderDescription';
import cli from '@battis/qui-cli';
import drive, { drive_v3 } from '@googleapis/drive';
import dotenv from 'dotenv';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { JSDOM } from 'jsdom';
import path from 'path';

dotenv.config();
const { values, positionals } = cli.init({
  env: { root: process.cwd() },
  args: {
    requirePositionals: 1,
    flags: {
      'ignore-errors': {
        description:
          'Ignore errors and continue uploading (default true, stop on errors with --no-ignore-errors',
        default: true
      },
      overwrite: {
        description:
          'Overwrite input file with updated index including upload data (default true, block with --no-overwrite)',
        default: true
      }
    },
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
    case 'application/vnd.google-apps.document':
    case 'application/vnd.google-apps.spreadsheet':
    case 'application/vnd.google-apps.presentation':
      return await fetchAsCompleteHtml(file, auth);
    case 'application/vnd.google-apps.shortcut':
      throw new Error(`${cli.colors.value(file.mimeType)} isn't handled yet`);
    default:
      const client = drive.drive({ version: 'v3', auth });
      const response = await client.files.get({
        fileId: file.id!,
        alt: 'media'
      });
      return {
        ['.']: response.data
      };
  }
}

function fileRenamer(
  filePath: string,
  file: FileDescription,
  filename?: string
) {
  const result = path.join(filePath, stripNonAlphanumeric(file, filename));
  switch (path.extname(filename || '')) {
    case '.html':
      return result.replace(/^(.*)\/([^\/]+)\.html$/, '$1/index.html');
    default:
      return result;
  }
}

async function demoteBodyToDiv(
  file: FileDescription,
  blob: Blob
): Promise<Blob> {
  if (blob.type?.startsWith('text/html')) {
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
      { type: blob.type }
    );
  }
  return blob;
}

async function removeScripts(file: FileDescription, blob: Blob): Promise<Blob> {
  if (blob.type?.startsWith('text/html')) {
    const dom = new JSDOM(await blob.text());
    Array.from(dom.window.document.querySelectorAll('script')).forEach((s) =>
      s.remove()
    );
    return new Blob([dom.window.document.documentElement.outerHTML], {
      type: blob.type
    });
  }
  return blob;
}

function onlyKbPermissionGroups(
  permission: drive_v3.Schema$Permission
): boolean {
  return /^kb-.*@groton.org$/.test(permission.emailAddress!);
}

async function uploadTree(subtree: FolderDescription, folderPath: string = '') {
  const folder = subtree['.'];
  const nextPath = path.join(folderPath, stripNonAlphanumeric(folder));
  spinner.start(nextPath);
  for (const fileName of Object.keys(subtree)) {
    if (fileName != '.') {
      const file = subtree[fileName];
      if (isFileDescription(file)) {
        subtree[fileName] = await uploadFile(file, nextPath);
      } else {
        subtree[fileName] = await uploadTree(file, nextPath);
      }
    }
  }
  spinner.succeed(cli.colors.url(nextPath));
  return subtree;
}

async function uploadFile(file: FileDescription, filePath: string = '') {
  spinner.start(`Uploading ${cli.colors.value(file.name)}`);
  try {
    if (
      !file.index ||
      !file.index.uploaded ||
      file.index.timestamp < file.modifiedTime!
    ) {
      file = await uploadToBucket({
        spinner,
        file,
        bucketName,
        fileFetcher: fetchAsHtmlIfPossible,
        fileNamer: (file, filename) => fileRenamer(filePath, file, filename),
        fileMutator: async (blob) =>
          removeScripts(file, await demoteBodyToDiv(file, blob)),
        permissionsFilter: onlyKbPermissionGroups
      });
    }
  } catch (error) {
    if (!values['ignore-errors']) {
      throw error;
    }
  }
  if (file.index?.uploaded) {
    spinner.succeed(
      `${cli.colors.url(`${filePath}/`)}${cli.colors.value(
        fileRenamer('', file)
      )}`
    );
  } else {
    spinner.fail(
      `${cli.colors.url(`${filePath}/`)}${cli.colors.value(
        fileRenamer('', file)
      )}`
    );
  }
  return file;
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
      let file = (tree[rootFolder] as FolderDescription)[fileName];
      if (isFileDescription(file)) {
        (tree[rootFolder] as FolderDescription)[fileName] = await uploadFile(
          file
        );
      } else {
        (tree[rootFolder] as FolderDescription)[fileName] = await uploadTree(
          file
        );
      }
    }
  }
  spinner.succeed(cli.colors.url(rootFolder));
  if (values.overwrite) {
    fs.writeFileSync(positionals[0].toString(), JSON.stringify(tree, null, 2));
  } else {
    fs.writeFileSync(
      positionals[0].toString() +
        '_upload-' +
        new Date().toISOString() +
        '.json',
      JSON.stringify(tree, null, 2)
    );
  }
})();
