// FIXME this is so bad!
import pipelineHTML from './Actions/pipelineHTML';
import IndexEntry from './IndexEntry';
import { JSONObject } from '@battis/typescript-tricks';
import { Storage } from '@google-cloud/storage';
import { drive_v3 } from '@googleapis/drive';
import Google from '@groton/knowledgebase.google';
import Zip from 'adm-zip';
import crypto from 'crypto';
import events from 'events';
import mime from 'mime-types';
import path from 'path';

type Nonoptional<T> = Exclude<T, null | undefined>;

export type IdType = Nonoptional<drive_v3.Schema$File['id']>;
export type NameType = Nonoptional<drive_v3.Schema$File['name']>;

interface File extends drive_v3.Schema$File {}

const DEFAULT_PERMISSIONS_REGEX = /.*/;
const DEFAULT_FORCE = false;
const DEFAULT_IGNORE_ERRORS = true;

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
    if (index) {
      if (_index) {
        index = IndexEntry.fromJSON({ ...index, ..._index });
      } else {
        index = IndexEntry.fromJSON(index as unknown as JSONObject);
      }
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
      case Google.MimeTypes.Doc:
      case Google.MimeTypes.Sheet:
      case Google.MimeTypes.Slides:
        return await this.fetchAsCompleteHtml();
      case Google.MimeTypes.Shortcut:
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
          mimeType: 'application/zip'
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

  private async exponentialBackoff(
    action: Function,
    ignoreErrors = DEFAULT_IGNORE_ERRORS,
    retries = 5,
    lastTimeout = 0
  ) {
    try {
      await action();
      return;
    } catch (_e) {
      const error = _e as { code?: number; message?: string };
      if (error.code == 503 && retries > 0) {
        File.event.emit(
          File.Event.Start,
          `${this.index.path} (${retries} retries left)`
        );
        const timeout = lastTimeout
          ? lastTimeout * 2
          : crypto.randomInt(50, 100);
        setTimeout(
          () =>
            this.exponentialBackoff(action, ignoreErrors, retries - 1, timeout),
          timeout
        );
      } else {
        this.index.status = error.message || JSON.stringify(error);
        File.event.emit(
          File.Event.Fail,
          `${this.index.path}: ${error.message} (driveId ${this.id})`
        );
        if (!ignoreErrors) {
          throw error;
        }
      }
    }
  }

  /**
   * Cache Drive file as complete web archive in Cloud Storage Bucket
   *
   * FIXME need to purge expired files from Cloud Storage as well as upload new files
   */
  public async cache({
    bucketName,
    permissionsRegex = DEFAULT_PERMISSIONS_REGEX,
    force = DEFAULT_FORCE,
    ignoreErrors = DEFAULT_IGNORE_ERRORS
  }: File.Params.Cache) {
    const bucket = Google.Client.getStorage().bucket(bucketName);
    if (!this.index.exists) {
      await this.exponentialBackoff(async () => {
        for (const uri of this.index.uri) {
          const filePath = uri.substr(`gs://${bucketName}/`.length);
          File.event.emit(File.Event.Start, filePath);
          const file = bucket.file(filePath);
          await file.delete();
          File.event.emit(File.Event.Fail, `${filePath}: expired and deleted`);
        }
        File.event.emit(
          File.Event.Fail,
          `${this.index.path}: expired and deleted`
        );
      }, ignoreErrors);
    } else if (
      force ||
      this.index.uri.length == 0 ||
      (this.modifiedTime && this.modifiedTime > this.index.timestamp)
    ) {
      this.index.status = IndexEntry.State.PreparingCache;
      await this.exponentialBackoff(async () => {
        const files = await this.fetchAsHtmlIfPossible();
        for (const subfileName in files) {
          await this.exponentialBackoff(async () => {
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
          }, ignoreErrors);
        }
        this.index.status = IndexEntry.State.Cached;
      }, ignoreErrors);
    }
  }

  public async resetPermissions({
    bucketName,
    permissionsRegex = DEFAULT_PERMISSIONS_REGEX,
    ignoreErrors = DEFAULT_IGNORE_ERRORS
  }: File.Params.Cache) {
    const bucket = Google.Client.getStorage().bucket(bucketName);
    for (const uri of this.index.uri) {
      const filePath = uri.replace(/^gs:\/\/[^/]+\//, '');
      File.event.emit(File.Event.Succeed, filePath);
      const file = bucket.file(filePath);
      for (const permission of this.permissions!.filter(
        (p) =>
          p.emailAddress &&
          new RegExp(permissionsRegex || '.*').test(p.emailAddress)
      )) {
        File.event.emit(File.Event.Start, `  ${permission.displayName}`);
        let entity: string;
        switch (permission.type) {
          case 'group':
            entity = `group-${permission.emailAddress}`;
            break;
          case 'user':
            entity = `user-${permission.emailAddress}`;
            break;
          default:
            throw new Error(`Cannot handle permission type ${permission.type}`);
        }
        if (entity) {
          await this.exponentialBackoff(async () => {
            await file.acl.add({ entity, role: Storage.acl.READER_ROLE });
            File.event.emit(File.Event.Succeed, `  ${entity}`);
          }, ignoreErrors);
        } else {
          File.event.emit(File.Event.Fail, `  ${permission.id}`);
        }
      }
    }
    this.index.update();
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
      force?: boolean;
      ignoreErrors?: boolean;
    };
  }
}

export default File;
