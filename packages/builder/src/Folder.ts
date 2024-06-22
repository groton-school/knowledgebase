import File, { IdType } from './File';
import Client from './Google/Client';
import IndexEntry from './IndexEntry';
import MimeTypes from './MimeTypes';
import { drive_v3 } from '@googleapis/drive';
import fs from 'fs/promises';
import path from 'path';

type FolderContentsType = Record<IdType, File | Folder>;

class Folder extends File {
  public readonly folderContents: FolderContentsType;

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
    this.folderContents = {};
    if (file.folderContents) {
      for (const id in file.folderContents) {
        if (Folder.isFolder(file.folderContents[id])) {
          this.folderContents[id] = new Folder(file.folderContents[id]);
        } else {
          this.folderContents[id] = new File(file.folderContents[id]);
        }
      }
    }
  }

  protected static async asyncConstructor(
    file: drive_v3.Schema$File & { index?: IndexEntry }
  ) {
    const folder = new Folder(file);
    if (folder.isEmpty()) {
      await folder.indexContents();
    }
    return folder;
  }

  public static isFolder(obj: File | Folder): obj is Folder {
    return 'mimeType' in obj && obj.mimeType == MimeTypes.Google.Folder;
  }

  public getContents(): (File | Folder)[] {
    return Object.values(this.folderContents);
  }

  public isEmpty() {
    return Object.getOwnPropertyNames(this.folderContents).length == 0;
  }

  public static async fromDriveId(fileId: string, index?: IndexEntry) {
    const file = await super.fromDriveId(fileId, index);
    return await Folder.asyncConstructor(file);
  }

  public static async fromDrive(
    file: drive_v3.Schema$File,
    index?: IndexEntry
  ) {
    return await Folder.asyncConstructor(new File(file, index));
  }

  public static async fromIndexFile(indexPath: string, index?: IndexEntry) {
    return new Folder(
      JSON.parse((await fs.readFile(indexPath)).toString()),
      index
    );
  }

  /**
   * Backwards-compatible with Overdrive.io naming scheme
   */
  protected static normalizeFilename(filename: string): string {
    return filename!
      .replace('&', 'and')
      .replace(/[^a-z0-9()!@*_.]+/gi, '-')
      .toLowerCase();
  }

  private async indexContents() {
    let folderContents: drive_v3.Schema$FileList = {};
    do {
      folderContents = (
        await (
          await Client.getDrive()
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
            this.folderContents[file.id] = await Folder.fromDrive(file);
          } else {
            this.folderContents[file.id] = file;
          }
          Folder.event.emit(
            Folder.Event.Succeed,
            this.folderContents[file.id].index.path
          );
        }
      }
    } while (folderContents.nextPageToken);
  }

  public async cache({ ignoreErrors, ...rest }: File.Params.Cache) {
    for (const file of this.getContents()) {
      try {
        await file.cache({ ignoreErrors, ...rest });
      } catch (error) {
        Folder.event.emit(
          Folder.Event.Fail,
          `${file.index.path}: ${(error as Error).message} (driveId ${file.id})`
        );
        if (!ignoreErrors) {
          throw error;
        }
      }
    }
  }
}

namespace Folder {
  export const Event = File.Event;
}

export default Folder;
