import { FileDescription } from '../Models/FolderDescription';
import authorize from './authorize';
import cli from '@battis/qui-cli';
import { Storage } from '@google-cloud/storage';
import { OAuth2Client } from 'google-auth-library';
import { drive_v3 } from 'googleapis';

type Configuration = {
  file: FileDescription;
  bucketName: string;
  spinner?: ReturnType<typeof cli.spinner>;
  fileNamer?: (file: drive_v3.Schema$File) => string;
  fileFetcher?: (
    file: drive_v3.Schema$File,
    oauth: OAuth2Client
  ) => Promise<Blob>;
  fileMutator?: (fileContents: Blob) => Promise<Blob>;
  permissionsFilter?: (permission: drive_v3.Schema$Permission) => boolean;
};

export function stripNonAlphanumeric(file: drive_v3.Schema$File): string {
  return file.name!.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

export async function fetchAsHtml(
  file: drive_v3.Schema$File,
  oauth: OAuth2Client
): Promise<Blob> {
  return await (
    await fetch(
      `https://docs.google.com/document/u/0/export?format=html&id=${file.id}`,
      {
        headers: {
          Authorize: `Bearer ${(await oauth.getAccessToken()).token}`
        }
      }
    )
  ).blob();
}

export async function blobPassThrough(blob: Blob): Promise<Blob> {
  return blob;
}

export function includeAll(): boolean {
  return true;
}

async function uploadToBucket({
  file,
  bucketName,
  spinner,
  fileNamer = stripNonAlphanumeric,
  fileFetcher = fetchAsHtml,
  fileMutator = blobPassThrough,
  permissionsFilter = includeAll
}: Configuration) {
  spinner?.start(
    `Uploading ${cli.colors.value(file.name)} to ${cli.colors.url(bucketName)}`
  );
  const oauth = await authorize(spinner);
  const raw = await fileFetcher(file, oauth);
  const blob = await fileMutator(raw);

  // storage authorization via process.env.GOOGLE_APPLICATION_CREDENTIALS
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const remoteFile = bucket.file(fileNamer(file));
  await remoteFile.save(Buffer.from(await blob.arrayBuffer()));
  for (const permission of (
    file.permissions as drive_v3.Schema$Permission[]
  ).filter(permissionsFilter)) {
    spinner?.start(`${spinner.text} (${permission.displayName})`);
    switch (permission.type) {
      case 'group':
        /** @type  */
        await (remoteFile.acl.readers as { addGroup: Function }).addGroup(
          permission.emailAddress
        );
        break;
      case 'user':
        await (remoteFile.acl.readers as { addUser: Function }).addUser(
          permission.emailAddress
        );
        break;
      default:
        cli.log.debug(
          `Unknown user type: ${JSON.stringify({
            fileId: file.id,
            permission
          })}`
        );
    }
  }
  spinner?.succeed(cli.colors.value(file.name));
}

export default uploadToBucket;
