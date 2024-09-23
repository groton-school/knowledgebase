import Google from '@groton/knowledgebase.google';
import File, { Id } from './File';
import IndexEntry from './IndexEntry';

class FileFactory<T extends typeof File> {
  public constructor(private fileType: T) {}

  private async resolveShortcut(file: Google.Drive.drive_v3.Schema$File) {
    if (
      file.mimeType == Google.MimeTypes.Shortcut &&
      file.shortcutDetails?.targetId
    ) {
      const targetFile: Google.Drive.drive_v3.Schema$File =
        await this.fromDriveId(file.shortcutDetails.targetId);
      return { ...targetFile, parents: file.parents, name: file.name };
    }
    return file;
  }

  public async fromDrive(
    file: Google.Drive.drive_v3.Schema$File,
    index?: IndexEntry
  ) {
    return new this.fileType(
      await this.resolveShortcut(file),
      index
    ) as InstanceType<T>;
  }

  public async fromDriveId(fileId: Id, index?: IndexEntry) {
    const file = (
      await (
        await Google.Client.getDrive()
      ).files.get({
        fileId,
        fields: File.fields.join(',')
      })
    ).data;
    return new this.fileType(
      await this.resolveShortcut(file),
      index
    ) as InstanceType<T>;
  }
}

namespace FileFactory {}

export default FileFactory;
