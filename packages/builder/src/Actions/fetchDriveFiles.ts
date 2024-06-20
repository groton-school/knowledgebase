import cli from '@battis/qui-cli';
import { drive_v3 } from '@googleapis/drive';
import drive from '@googleapis/drive';
import Zip from 'adm-zip';
import { OAuth2Client } from 'google-auth-library';
import mime from 'mime-types';

export async function fetchAsHtmlIfPossible({
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

export function fetchAsCompleteHtml({
  file,
  auth
}: {
  file: drive_v3.Schema$File;
  auth: OAuth2Client;
}): Promise<Record<string, Blob>> {
  return new Promise(async (resolve, reject) => {
    const client = drive.drive({ version: 'v3', auth });
    try {
      const response = await client.files.export({
        fileId: file.id!,
        mimeType: 'application/zip'
      });
      const zip = new Zip(
        Buffer.from(await (response.data as Blob).arrayBuffer())
      );
      const blobs: Record<string, Blob> = {};
      zip.getEntries().forEach((entry) => {
        const data = zip.readFile(entry);
        if (data) {
          blobs[entry.entryName] = new Blob([data], {
            type: mime.contentType(entry.name) || undefined
          });
        }
      });
      resolve(blobs);
    } catch (error) {
      reject(error);
    }
  });
}
