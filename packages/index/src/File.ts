// FIXME this is so bad!
import pipelineHTML from './Actions/pipelineHTML';
import IndexEntry from './IndexEntry';
import { Storage } from '@google-cloud/storage';
import { drive_v3 } from '@googleapis/drive';
import Google from '@groton/knowledgebase.google';
import Zip from 'adm-zip';
import events from 'events';
import mime from 'mime-types';
import path from 'path';

type Nonoptional<T> = Exclude<T, null | undefined>;

export type IdType = Nonoptional<drive_v3.Schema$File['id']>;
export type NameType = Nonoptional<drive_v3.Schema$File['name']>;

interface File extends drive_v3.Schema$File {}

class File {
  public readonly id: IdType;
  public readonly name: NameType;
  public readonly description: drive_v3.Schema$File['description'];
  public readonly modifiedTime: drive_v3.Schema$File['modifiedTime'];
  public readonly permissions: drive_v3.Schema$File['permissions'];
  public index: IndexEntry;

  public static event = new events.EventEmitter();

  protected constructor(file: drive_v3.Schema$File, index?: IndexEntry);
  protected constructor(file: drive_v3.Schema$File & { index: IndexEntry });
  protected constructor(
    {
      id,
      name,
      index = undefined,
      ...rest
    }: drive_v3.Schema$File & { index?: IndexEntry },
    _index?: IndexEntry
  ) {
    if (id) {
      this.id = id;
    } else {
      throw new Error(`id is ${id}`);
    }
    if (name) {
      this.name = name;
    } else {
      throw new Error(`name is ${name}`);
    }
    if (index && _index) {
      index = { ...index, ..._index };
    }
    this.index = index || _index || new IndexEntry();
    Object.assign(this, rest);
  }

  public static async fromDrive(
    file: drive_v3.Schema$File,
    index?: IndexEntry
  ) {
    return new File(file, index);
  }

  public static async fromDriveId(fileId: IdType, index?: IndexEntry) {
    const file = (
      await (
        await Google.Client.getDrive()
      ).files.get({
        fileId,
        fields:
          'id,name,fileExtension,mimeType,description,parents,permissions,modifiedTime'
      })
    ).data;
    return new File(file, index);
  }

  public async fetchAsHtmlIfPossible() {
    switch (this.mimeType) {
      case Google.MimeTypes.Google.Doc:
      case Google.MimeTypes.Google.Sheet:
      case Google.MimeTypes.Google.Slides:
        return await this.fetchAsCompleteHtml();
      case Google.MimeTypes.Google.Shortcut:
        throw new Error(`${this.mimeType} isn't handled yet`);
      default:
        return {
          '.': (
            await (
              await Google.Client.getDrive()
            ).files.get({
              fileId: this.id!,
              alt: 'media'
            })
          ).data
        };
    }
  }

  protected async fetchAsCompleteHtml(): Promise<Record<string, Blob>> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await (
          await Google.Client.getDrive()
        ).files.export({
          fileId: this.id!,
          mimeType: Google.MimeTypes.ZipArchive
        });
        const zip = new Zip(
          Buffer.from(await (response.data as Blob).arrayBuffer())
        );
        const blobs: Record<string, Blob> = {};
        zip.getEntries().forEach((entry) => {
          const data = zip.readFile(entry);
          if (data) {
            blobs[entry.entryName] = new Blob([data], {
              type: mime.contentType(entry.name) || undefined
            });
          }
        });
        resolve(blobs);
      } catch (error) {
        reject(error);
      }
    });
  }

  protected static normalizeSubfileName(basePath: string, subfileName: string) {
    if (subfileName == '.') {
      return basePath;
    }
    if (/\.html$/.test(subfileName)) {
      subfileName = 'index.html';
    }
    return path.join(basePath, subfileName);
  }

  /**
   * Cache Drive file as complete web archive in Cloud Storage Bucket
   */
  public async cache({
    bucketName,
    permissionsRegex,
    force,
    ignoreErrors
  }: File.Params.Cache) {
    const bucket = Google.Client.getStorage().bucket(bucketName);
    if (
      force ||
      this.index.uri.length == 0 ||
      (this.modifiedTime && this.modifiedTime > this.index.timestamp)
    ) {
      this.index.status = IndexEntry.State.PreparingCache;
      const files = await this.fetchAsHtmlIfPossible();
      let errors = 0;
      for (const subfileName in files) {
        try {
          let filename = File.normalizeSubfileName(
            this.index.path,
            subfileName
          );
          File.event.emit(File.Event.Start, filename);
          const file = bucket.file(filename);
          const blob = await pipelineHTML({
            file: this,
            blob: (files as Record<string, Blob>)[subfileName] // TODO better fix than manual typing
          });
          file.save(Buffer.from(await blob.arrayBuffer()));
          this.index.uri.push(file.cloudStorageURI.href);
          File.event.emit(File.Event.Succeed, filename);

          for (const permission of this.permissions!.filter(
            (p) =>
              p.emailAddress &&
              new RegExp(permissionsRegex || '.*').test(p.emailAddress)
          )) {
            File.event.emit(File.Event.Start, `  ${permission.displayName}`);
            let entity;
            switch (permission.type) {
              case 'group':
                entity = `group-${permission.emailAddress}`;
                break;
              case 'user':
                entity = `user-${permission.emailAddress}`;
                break;
              default:
                throw new Error(
                  `Cannot handle permission type ${permission.type}`
                );
            }
            if (entity) {
              await file.acl.add({ entity, role: Storage.acl.READER_ROLE });
              File.event.emit(File.Event.Succeed, `  ${entity}`);
            } else {
              File.event.emit(File.Event.Fail, `  ${permission.id}`);
            }
          }
        } catch (error) {
          this.index.status = (error as Error).message;
          File.event.emit(
            File.Event.Fail,
            `${this.index.path}: ${(error as Error).message} (driveId ${
              this.id
            })`
          );
          if (!ignoreErrors) {
            throw error;
          } else {
            errors++;
          }
        }
      }
      this.index.status = IndexEntry.State.Cached;
    }
  }
}

namespace File {
  export namespace Event {
    export const Start = 'start';
    export const Succeed = 'succeed';
    export const Fail = 'fail';
  }
  export namespace Params {
    export type Cache = {
      bucketName: string;
      permissionsRegex?: string | RegExp;
      force: boolean;
      ignoreErrors: boolean;
    };
  }
}

export default File;
