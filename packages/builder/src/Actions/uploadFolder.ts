import Folder, { isFile } from '../Schema/Folder';
import { convertToOverdriveStyle } from './pipelineFileName';
import uploadFile from './uploadFile';
import cli from '@battis/qui-cli';
import path from 'path';

async function uploadFolder({
  folder,
  folderPath = '',
  bucketName,
  spinner,
  force,
  ignoreErrors
}: {
  folder: Folder;
  folderPath?: string;
  bucketName: string;
  force: boolean;
  ignoreErrors: boolean;
  spinner?: ReturnType<typeof cli.spinner>;
}) {
  const thisFolder = folder['.'];
  const nextPath = path.join(
    folderPath,
    convertToOverdriveStyle({ file: thisFolder })
  );
  spinner?.start(nextPath);
  for (const fileName of Object.keys(folder)) {
    if (fileName != '.') {
      const file = folder[fileName];
      if (isFile(file)) {
        folder[fileName] = await uploadFile({
          file,
          filePath: nextPath,
          bucketName,
          force,
          ignoreErrors,
          spinner
        });
      } else {
        folder[fileName] = await uploadFolder({
          folder: file,
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
  return folder;
}

export default uploadFolder;
