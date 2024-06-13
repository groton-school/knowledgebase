import FolderDescription, {
  FileDescription
} from '../Models/FolderDescription';
import authorize from './authorize';
import cli from '@battis/qui-cli';
import drive, { drive_v3 } from '@googleapis/drive';
import path from 'path';

async function buildTree(
  folderId: string,
  spinner?: ReturnType<typeof cli.spinner>
) {
  const auth = await authorize(spinner);
  const client = drive.drive({ version: 'v3', auth });
  var tree: FolderDescription = {};

  async function describeFile(
    file: drive_v3.Schema$File,
    spinner?: ReturnType<typeof cli.spinner>
  ): Promise<FileDescription> {
    spinner?.start(`Describing ${spinner.text}`);
    const permissions = await client.permissions.list({
      fileId: file.id!
    });
    return (
      await client.files.get({
        fileId: file.id!,
        fields:
          'id,name,fileExtension,mimeType,description,parents,permissions,modifiedTime'
      })
    ).data;
  }

  async function folderContentsRecursive(
    folderId: string,
    folderPath: string
  ): Promise<FolderDescription> {
    spinner?.start(folderPath);
    const tree: FolderDescription = {
      '.': await describeFile({ id: folderId })
    };
    const response = await client.files.list({
      q: `'${folderId}' in parents and trashed = false`
    });
    if (response.data.nextPageToken) {
      cli.log.debug(`${tree['.'].name} (${folderId}) has a nextPageToken`);
    }
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

  const response = await client.files.get({
    fileId: folderId
  });
  spinner?.start(response.data.name!);

  const subtree = await folderContentsRecursive(folderId, response.data.name!);
  tree[response.data.name!] = subtree;
  return tree;
}

export default buildTree;