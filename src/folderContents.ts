import type FileDescription from './FileDescription';
import FolderDescription from './FolderDescription';
import authorize from './authorize';
import cli from '@battis/qui-cli';
import { google, drive_v3 } from 'googleapis';
import path from 'path';

async function folderContents(
  folderId: string,
  spinner?: ReturnType<typeof cli.spinner>
) {
  const client = await authorize(spinner);
  const drive = google.drive({ version: 'v3', auth: client });
  var tree: FolderDescription = {};

  async function describeFile(
    file: drive_v3.Schema$File,
    spinner?: ReturnType<typeof cli.spinner>
  ): Promise<FileDescription> {
    spinner?.start(`${spinner.text} (getting access)`);
    const permissions = await drive.permissions.list({
      fileId: file.id!
    });
    const access: string[] = [];
    for (const permission of permissions.data.permissions!) {
      access.push(
        (
          await drive.permissions.get({
            fileId: file.id!,
            permissionId: permission.id,
            fields: 'emailAddress'
          })
        ).data.emailAddress
      );
    }
    return {
      id: file.id!,
      name: file.name!,
      access
    };
  }

  async function folderContentsRecursive(
    folderId: string,
    folderPath: string
  ): Promise<FolderDescription> {
    spinner?.start(folderPath);
    const tree: FolderDescription = {
      '.': await describeFile(
        (
          await drive.files.get({ fileId: folderId })
        ).data
      )
    };
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`
    });
    if (response.data.files?.length) {
      for (const file of response.data.files) {
        if (file.mimeType == 'application/vnd.google-apps.folder') {
          tree[file.name!] = await folderContentsRecursive(
            file.id!,
            `${path.join(folderPath, file.name!)}`
          );
        } else {
          tree[file.name!] = await describeFile(file);
        }
      }
    }
    return tree;
  }

  const response = await drive.files.get({
    fileId: folderId
  });
  spinner?.start(response.data.name!);

  const subtree = await folderContentsRecursive(folderId, response.data.name!);
  tree[response.data.name!] = subtree;
  return tree;
}

export default folderContents;
