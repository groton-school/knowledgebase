#!/usr/bin/env tsx
import uploadToBucket, {
  stripNonAlphanumeric,
  fetchAsCompleteHtml
} from '../src/Actions/uploadToBucket';
import FileDescription, {
  isFileDescription
} from '../src/Models/FileDescription';
import FolderDescription from '../src/Models/FolderDescription';
import cli from '@battis/qui-cli';
import drive, { drive_v3 } from '@googleapis/drive';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { JSDOM } from 'jsdom';
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

async function fetchAsHtmlIfPossible({
  file,
  auth
}: {
  file: drive_v3.Schema$File;
  auth: OAuth2Client;
}) {
  switch (file.mimeType) {
    case 'application/vnd.google-apps.document':
    case 'application/vnd.google-apps.spreadsheet':
    case 'application/vnd.google-apps.presentation':
      return await fetchAsCompleteHtml({ file, auth });
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

function fileRenamer({
  filePath,
  file,
  filename
}: {
  filePath: string;
  file: FileDescription;
  filename?: string;
}) {
  const result = path.join(filePath, stripNonAlphanumeric({ file, filename }));
  switch (path.extname(filename || '')) {
    case '.html':
      return result.replace(/^(.*)\/([^\/]+)\.html$/, '$1/index.html');
    default:
      return result;
  }
}

async function addMetaId({
  file,
  blob
}: {
  file: FileDescription;
  blob: Blob;
}): Promise<Blob> {
  if (blob.type?.startsWith('text/html')) {
    const html = await blob.text();
    return new Blob(
      [
        html.replace(
          '<style',
          `<meta item-prop="kb.id" content="${file.id}" /><style`
        )
      ],
      { type: blob.type }
    );
  }
  return blob;
}

async function demoteBodyToDiv({
  file,
  blob
}: {
  file: FileDescription;
  blob: Blob;
}): Promise<Blob> {
  if (blob.type?.startsWith('text/html')) {
    const html = await blob.text();
    return new Blob(
      [html.replace('<body', '<body><div').replace('</body>', `</div></body>`)],
      { type: blob.type }
    );
  }
  return blob;
}

async function injectAssets({
  file,
  blob
}: {
  file: FileDescription;
  blob: Blob;
}): Promise<Blob> {
  if (blob.type?.startsWith('text/html')) {
    const html = await blob.text();
    return new Blob(
      [
        html
          .replace(
            '<head>',
            '<head><link rel="icon" href="/assets/favicon.ico">'
          )
          .replace(
            '</head>',
            `<link rel="stylesheet" href="/assets/kb.css" /></head>`
          )
          .replace('</body>', `<script href="/assets/kb.js"></script></body>`)
      ],
      { type: blob.type }
    );
  }
  return blob;
}

async function removeScripts({
  file,
  blob
}: {
  file: FileDescription;
  blob: Blob;
}): Promise<Blob> {
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

async function uploadTree({
  subtree,
  folderPath = '',
  bucketName,
  spinner,
  force,
  ignoreErrors
}: {
  subtree: FolderDescription;
  folderPath?: string;
  bucketName: string;
  force: boolean;
  ignoreErrors: boolean;
  spinner?: ReturnType<typeof cli.spinner>;
}) {
  const folder = subtree['.'];
  const nextPath = path.join(
    folderPath,
    stripNonAlphanumeric({ file: folder })
  );
  spinner?.start(nextPath);
  for (const fileName of Object.keys(subtree)) {
    if (fileName != '.') {
      const file = subtree[fileName];
      if (isFileDescription(file)) {
        subtree[fileName] = await uploadFile({
          file,
          filePath: nextPath,
          bucketName,
          force,
          ignoreErrors,
          spinner
        });
      } else {
        subtree[fileName] = await uploadTree({
          subtree: file,
          folderPath: nextPath,
          bucketName,
          force,
          ignoreErrors,
          spinner
        });
      }
    }
  }
  spinner?.succeed(cli.colors.url(nextPath));
  return subtree;
}

async function uploadFile({
  file,
  filePath = '',
  bucketName,
  spinner,
  force,
  ignoreErrors
}: {
  file: FileDescription;
  filePath?: string;
  spinner?: ReturnType<typeof cli.spinner>;
  force: boolean;
  ignoreErrors: boolean;
  bucketName: string;
}) {
  spinner?.start(`Uploading ${cli.colors.value(file.name)}`);
  try {
    if (
      force ||
      !file.index ||
      !file.index.uploaded ||
      file.index.timestamp < file.modifiedTime!
    ) {
      file = await uploadToBucket({
        spinner,
        file,
        bucketName,
        fileFetcher: fetchAsHtmlIfPossible,
        fileNamer: ({ file, filename }) =>
          fileRenamer({ filePath, file, filename }),
        fileMutator: async (blob) =>
          injectAssets({
            file,
            blob: await removeScripts({
              file,
              blob: await demoteBodyToDiv({
                file,
                blob: await addMetaId({ file, blob })
              })
            })
          }),
        permissionsFilter: onlyKbPermissionGroups
      });
    }
  } catch (error) {
    if (!ignoreErrors) {
      throw error;
    }
  }
  if (file.index?.uploaded) {
    spinner?.succeed(
      `${cli.colors.url(`${filePath}/`)}${cli.colors.value(
        fileRenamer({ filePath: '', file })
      )}`
    );
  } else {
    spinner?.fail(
      `${cli.colors.url(`${filePath}/`)}${cli.colors.value(
        fileRenamer({ filePath: '', file })
      )}`
    );
  }
  return file;
}

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
  const tree: FolderDescription = JSON.parse(
    fs
      .readFileSync(path.resolve(cli.appRoot(), indexPath).toString())
      .toString()
  );
  spinner.succeed(positionals[0]);

  const rootFolder = Object.keys(tree)[0];
  spinner.start(rootFolder);
  for (const fileName of Object.keys(tree[rootFolder])) {
    if (fileName != '.') {
      let file = (tree[rootFolder] as FolderDescription)[fileName];
      if (isFileDescription(file)) {
        (tree[rootFolder] as FolderDescription)[fileName] = await uploadFile({
          file,
          bucketName,
          force,
          ignoreErrors,
          spinner
        });
      } else {
        (tree[rootFolder] as FolderDescription)[fileName] = await uploadTree({
          subtree: file,
          bucketName,
          force,
          ignoreErrors,
          spinner
        });
      }
    }
  }
  spinner.succeed(cli.colors.url(rootFolder));
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
