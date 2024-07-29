import File, { IdType } from './File';
import IndexEntry from './IndexEntry';
import { JSONObject } from '@battis/typescript-tricks';
import { drive_v3 } from '@googleapis/drive';
import Google from '@groton/knowledgebase.google';
import path from 'path';

type FolderContentsType = Record<IdType, File | Folder>;

class Folder extends File {
  protected constructor(file: drive_v3.Schema$File);
  protected constructor(
    file: drive_v3.Schema$File & {
      index?: IndexEntry;
      folderContents?: FolderContentsType;
    }
  );
  protected constructor(file: drive_v3.Schema$File, index?: IndexEntry);
  protected constructor(
    file: drive_v3.Schema$File & {
      index?: IndexEntry;
      folderContents?: FolderContentsType;
    },
    index?: IndexEntry
  ) {
    super(file, index);
    if (!Folder.isFolder(this)) {
      throw new Error(`Invalid folder ${JSON.stringify(this)}`);
    }
  }

  public static isFolder(obj: File | Folder): obj is Folder {
    return 'mimeType' in obj && obj.mimeType == Google.MimeTypes.Folder;
  }

  public static async fromDriveId(fileId: string, index?: IndexEntry) {
    const file = await super.fromDriveId(fileId, index);
    return new Folder(file);
  }

  public static async fromDrive(
    file: drive_v3.Schema$File,
    index?: IndexEntry
  ) {
    return new Folder(new File(file, index));
  }

  /**
   * Backwards-compatible with Overdrive.io naming scheme
   */
  protected static normalizeFilename(filename: string): string {
    return filename!
      .replace('&', 'and')
      .replace(/[^a-z0-9()!@*_.]+/gi, '-')
      .replace(/-+$/, '')
      .toLowerCase();
  }

  /**
   * TODO _re_ index non-destructively
   * TODO delete/rename cached files
   */
  public async indexContents(): Promise<File[]> {
    let contents: File[] = [];
    let folderContents: drive_v3.Schema$FileList = {};
    do {
      folderContents = (
        await (
          await Google.Client.getDrive()
        ).files.list({
          q: `'${this.id}' in parents and trashed = false`,
          supportsAllDrives: true,
          pageToken: folderContents?.nextPageToken || undefined
        })
      ).data;

      if (folderContents.files?.length) {
        for (const item of folderContents.files) {
          if (!item.name) {
            throw new Error(`${item.id} is unnamed`);
          }
          Folder.event.emit(
            Folder.Event.Start,
            path.join(this.index.path, item.name)
          );
          const file = await File.fromDriveId(
            item.id!,
            new IndexEntry(this.index.path)
          );
          file.index = new IndexEntry(
            path.join(this.index.path, Folder.normalizeFilename(file.name))
          );
          if (Folder.isFolder(file)) {
            const folder = await Folder.fromDrive(file);
            contents.push(folder);
            contents.push(...(await folder.indexContents()));
          } else {
            contents.push(file);
          }
          Folder.event.emit(Folder.Event.Succeed, file.index.path);
        }
      }
    } while (folderContents.nextPageToken);
    return contents;
  }

  public async cache() {
    return;
  }
}

namespace Folder {
  export const Event = File.Event;
}

export default Folder;
