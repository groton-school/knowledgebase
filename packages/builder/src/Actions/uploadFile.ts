import File from '../Schema/File';
import exportDriveToBucket from './exportDriveToBucket';
import { fetchAsHtmlIfPossible } from './fetchDriveFiles';
import { selectiveRename } from './pipelineFileName';
import pipelineHTML from './pipelineHTML';
import filterPermissions from './pipelinePermissions';
import cli from '@battis/qui-cli';

async function uploadFile({
  file,
  filePath = '',
  bucketName,
  spinner,
  force,
  ignoreErrors
}: {
  file: File;
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
      file = await exportDriveToBucket({
        spinner,
        file,
        bucketName,
        fileFetcher: fetchAsHtmlIfPossible,
        fileNamer: ({ file, filename }) =>
          selectiveRename({ filePath, file, filename }),
        fileMutator: async (blob) => pipelineHTML({ file, blob }),
        permissionsFilter: filterPermissions
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
        selectiveRename({ filePath: '', file })
      )}`
    );
  } else {
    spinner?.fail(
      `${cli.colors.url(`${filePath}/`)}${cli.colors.value(
        selectiveRename({ filePath: '', file })
      )}`
    );
  }
  return file;
}

export default uploadFile;
