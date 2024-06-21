import File from '../Schema/File';
import Folder from '../Schema/Folder';
import Tree from '../Schema/Tree';
import authorize from './authorize';
import cli from '@battis/qui-cli';
import drive, { drive_v3 } from '@googleapis/drive';
import path from 'path';

async function buildTree(
  folderId: string,
  spinner?: ReturnType<typeof cli.spinner>
): Promise<Tree> {
  const auth = await authorize(spinner);
  const client = drive.drive({ version: 'v3', auth });

  async function describeFile(
    file: drive_v3.Schema$File,
    spinner?: ReturnType<typeof cli.spinner>
  ): Promise<File> {
    spinner?.start(`Describing ${spinner.text}`);
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
  ): Promise<Folder> {
    if (path.dirname(folderPath) != '.') {
      spinner?.start(
        `${cli.colors.url(path.dirname(folderPath))}/${cli.colors.value(
          path.basename(folderPath)
        )}`
      );
    } else {
      spinner?.start(cli.colors.value(folderPath));
    }
    const tree: Folder = {
      '.': await describeFile({ id: folderId })
    } as Folder;
    const response = await client.files.list({
      q: `'${folderId}' in parents and trashed = false`
    });
    if (response.data.nextPageToken) {
      const message = cli.colors.error(
        `${cli.colors.url(folderPath)}/${cli.colors.value(
          tree['.'].name
        )} (${folderId}) has a nextPageToken that is being ignored`
      );
      if (spinner) {
        const status = spinner.text;
        spinner.fail(message);
        spinner.start(status);
      } else {
        cli.log.error(message);
      }
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
    if (path.dirname(folderPath) != '.') {
      spinner?.succeed(
        `${cli.colors.url(path.dirname(folderPath))}/${cli.colors.value(
          path.basename(folderPath)
        )}`
      );
    } else {
      spinner?.succeed(cli.colors.value(folderPath));
    }
    return tree;
  }

  const response = await client.files.get({
    fileId: folderId
  });
  spinner?.start(response.data.name!);

  return {
    folder: await folderContentsRecursive(folderId, response.data.name!)
  };
}

export default buildTree;
