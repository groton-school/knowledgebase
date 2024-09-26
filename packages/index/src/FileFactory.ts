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
    const drive = await Google.Client.getDrive();
    const { data: file } = await drive.files.get({
      fileId,
      /**
       * @see https://developers.google.com/drive/api/reference/rest/v3/files#File.FIELDS.permissions on shared drives, the permissions property is never populated
       */
      fields: File.fields.filter((field) => field != 'permissions').join(','),
      supportsAllDrives: true
    });

    const {
      data: { permissions: permissionsList }
    } = await drive.permissions.list({
      fileId,
      supportsAllDrives: true
    });

    const permissions = [];
    for (const permission of permissionsList!) {
      const { data } = await drive.permissions.get({
        fileId,
        permissionId: permission.id!,
        fields: 'emailAddress,role,type',
        supportsAllDrives: true
      });
      permissions.push(data);
    }

    return new this.fileType(
      await this.resolveShortcut({
        ...file,
        permissions
      }),
      index
    ) as InstanceType<T>;
  }
}

namespace FileFactory {}

export default FileFactory;
