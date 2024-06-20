import { isFileDescription } from '../Models/FileDescription';
import FolderDescription from '../Models/FolderDescription';
import { convertToOverdriveStyle } from './renameFile';
import uploadFile from './uploadFile';
import cli from '@battis/qui-cli';
import path from 'path';

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
    convertToOverdriveStyle({ file: folder })
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

export default uploadTree;
