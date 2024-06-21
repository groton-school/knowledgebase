import File from '../Schema/File';
import authorize from './authorize';
import { fetchAsCompleteHtml } from './fetchDriveFiles';
import { convertToOverdriveStyle } from './pipelineFileName';
import cli from '@battis/qui-cli';
import { Storage } from '@google-cloud/storage';
import { drive_v3 } from '@googleapis/drive';
import { OAuth2Client } from 'google-auth-library';

type Configuration = {
  file: File;
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

async function exportDriveToBucket({
  file,
  bucketName,
  spinner,
  fileNamer = convertToOverdriveStyle,
  fileFetcher = fetchAsCompleteHtml,
  fileMutator = async (blob) => blob,
  permissionsFilter = () => true
}: Configuration): Promise<File> {
  try {
    spinner?.start(`Processing ${cli.colors.value(file.name)}`);
    const auth = await authorize(spinner);
    const rawFiles = await fileFetcher({ file, auth });
    for (let _f in rawFiles) {
      let blob = await fileMutator(rawFiles[_f] as Blob);
      let filename: string | undefined = _f;
      if (filename == '.') {
        filename = undefined;
      }
      const storage = new Storage();
      const bucket = storage.bucket(bucketName);
      const remoteFile = bucket.file(fileNamer({ file, filename }));
      spinner?.start(
        `${cli.colors.value(remoteFile.cloudStorageURI.href)} (${
          blob.size
        } bytes)`
      );
      await remoteFile.save(Buffer.from(await blob.arrayBuffer()));
      spinner?.succeed(cli.colors.url(remoteFile.cloudStorageURI.href));
      file.index = {
        timestamp: new Date().toISOString(),
        uploaded: true,
        uri: remoteFile.cloudStorageURI.href
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

export default exportDriveToBucket;
