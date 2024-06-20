import FileDescription from '../Models/FileDescription';
import authorize from './authorize';
import cli from '@battis/qui-cli';
import { Storage } from '@google-cloud/storage';
import drive, { drive_v3 } from '@googleapis/drive';
import Zip from 'adm-zip';
import { OAuth2Client } from 'google-auth-library';
import mime from 'mime-types';

type Configuration = {
  file: FileDescription;
  bucketName: string;
  spinner?: ReturnType<typeof cli.spinner>;
  fileNamer?: (params: {
    file: drive_v3.Schema$File;
    filename?: string;
  }) => string;
  fileFetcher?: (params: {
    file: drive_v3.Schema$File;
    auth: OAuth2Client;
  }) => Promise<Record<string, Blob | drive_v3.Schema$File>>;
  fileMutator?: (fileContents: Blob) => Promise<Blob>;
  permissionsFilter?: (permission: drive_v3.Schema$Permission) => boolean;
};

export function stripNonAlphanumeric({
  file,
  filename
}: {
  file: drive_v3.Schema$File;
  filename?: string;
}): string {
  return (
    file.name!.replace(/[^a-z0-9()!@*_+=;:,.]+/gi, '-').toLowerCase() +
    (filename ? `/${filename}` : '')
  );
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
  fileFetcher = fetchAsCompleteHtml,
  fileMutator = blobPassThrough,
  permissionsFilter = includeAll
}: Configuration): Promise<FileDescription> {
  try {
    spinner?.start(`Processing ${cli.colors.value(file.name)}`);
    const auth = await authorize(spinner);
    const rawFiles = await fileFetcher({ file, auth });
    for (let _f in rawFiles) {
      let blob = await fileMutator(rawFiles[_f]);
      let filename: string | undefined = _f;
      if (filename == '.') {
        filename = undefined;
      }
      // storage authorization via process.env.GOOGLE_APPLICATION_CREDENTIALS
      const storage = new Storage();
      const bucket = storage.bucket(bucketName);
      const remoteFile = bucket.file(fileNamer({ file, filename }));
      spinner?.start(
        `Uploading ${cli.colors.value(remoteFile.name)} (${blob.size} bytes)`
      );
      await remoteFile.save(Buffer.from(await blob.arrayBuffer()));
      spinner?.succeed(
        cli.colors.url(
          `https://storage.cloud.google.com/${bucketName}/${remoteFile.name}`
        )
      );
      file.index = {
        timestamp: new Date().toISOString(),
        uploaded: true,
        url: `https://storage.cloud.google.com/${bucketName}/${remoteFile.name}`
      };
      for (const permission of (
        file.permissions as drive_v3.Schema$Permission[]
      ).filter(permissionsFilter)) {
        spinner?.start(
          `  * Adding reader permissions to ${cli.colors.value(
            filename || file.name
          )} for ${cli.colors.value(permission.displayName)}`
        );
        let entity: string | undefined = undefined;
        switch (permission.type) {
          case 'group':
            entity = `group-${permission.emailAddress}`;
            break;
          case 'user':
            entity = `user-${permission.emailAddress}`;
            break;
          default:
            spinner?.fail(
              cli.colors.error(
                `  - ${cli.colors.value(
                  permission.displayName
                )} scope type unknown`
              )
            );
        }
        if (entity) {
          await remoteFile.acl.add({
            entity,
            role: Storage.acl.READER_ROLE
          });
          spinner?.succeed(
            `  + ${cli.colors.value(permission.displayName)} is reader`
          );
        }
      }
    }
  } catch (error) {
    spinner?.fail(
      cli.colors.error(
        `Error uploading ${cli.colors.value(file.name)}: ${
          (error as Error).message
        }`
      )
    );
    file.index = {
      timestamp: new Date().toISOString(),
      uploaded: false,
      status: (error as Error).message
    };
  }
  return file;
}

export default uploadToBucket;
