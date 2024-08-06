import File, { IdType } from './File';
import IndexEntry from './IndexEntry';
import Google from '@groton/knowledgebase.google';

class FileFactory<T extends typeof File> {
  public constructor(private fileType: T) {}

  public async fromDrive(
    file: Google.Drive.drive_v3.Schema$File,
    index?: IndexEntry
  ) {
    return new this.fileType(file, index) as InstanceType<T>;
  }

  public async fromDriveId(fileId: IdType, index?: IndexEntry) {
    const file = (
      await (
        await Google.Client.getDrive()
      ).files.get({
        fileId,
        fields:
          'id,name,fileExtension,mimeType,description,parents,permissions,modifiedTime'
      })
    ).data;
    return new this.fileType(file, index) as InstanceType<T>;
  }
}

namespace FileFactory {}

export default FileFactory;
