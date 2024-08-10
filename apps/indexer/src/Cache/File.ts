import * as Helper from '../Helper';
import pipelineHTML from './Actions/pipelineHTML';
import Google from '@groton/knowledgebase.google';
import Index from '@groton/knowledgebase.index';
import Zip from 'adm-zip';
import crypto from 'crypto';
import events from 'events';
import mime from 'mime-types';
import path from 'path';

const DEFAULT_PERMISSIONS_REGEX = /.*/;
const DEFAULT_FORCE = false;
const DEFAULT_IGNORE_ERRORS = true;

class File extends Index.File {
  public static event = new events.EventEmitter();

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
          Helper.errorMessage(undefined, { driveId: this.id }, error)
        );
        if (!ignoreErrors) {
          throw error;
        }
      }
    }
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
    if (this.isFolder()) {
      let contents: File[] = [];
      let folderContents: Google.Drive.drive_v3.Schema$FileList = {};
      const fileFactory = new Index.FileFactory(File);

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
            File.event.emit(
              File.Event.Start,
              `Indexing ${path.join(this.index.path, item.name)}`
            );
            const file = await fileFactory.fromDriveId(
              item.id!,
              new Index.IndexEntry(this.index.path)
            );
            file.index = new Index.IndexEntry(
              path.join(this.index.path, File.normalizeFilename(file.name))
            );
            if (file.isFolder()) {
              contents.push(file);
              contents.push(...(await file.indexContents()));
            } else {
              contents.push(file);
            }
            File.event.emit(File.Event.Succeed, `${file.index.path} indexed`);
          }
        }
      } while (folderContents.nextPageToken);
      return contents;
    }
  }

  /**
   * Cache Drive file as complete web archive in Cloud Storage Bucket
   *
   * FIXME need to purge expired files from Cloud Storage as well as upload new files
   */
  public async cache({
    bucketName,
    force = DEFAULT_FORCE,
    ignoreErrors = DEFAULT_IGNORE_ERRORS
  }: File.Params.Cache) {
    if (!this.isFolder()) {
      const bucket = Google.Client.getStorage().bucket(bucketName);
      if (!this.index.exists) {
        File.event.emit(File.Event.Start, `${this.index.path} expired`);
        let success = true;
        await this.exponentialBackoff(async () => {
          for (const uri of this.index.uri) {
            File.event.emit(File.Event.Start, `${uri} expired`);
            const file = bucket.file(
              path.join(this.index.path, path.basename(uri))
            );
            try {
              await file.delete();
              File.event.emit(
                File.Event.Succeed,
                `${file.name} expired and deleted`
              );
            } catch (error) {
              File.event.emit(
                File.Event.Fail,
                Helper.errorMessage(
                  `Error deleting ${file.name}`,
                  { driveId: this.id },
                  error
                )
              );
              success = false;
            }
          }
          File.event.emit(
            success ? File.Event.Succeed : File.Event.Fail,
            `${this.index.path} expired and deleted${
              success ? '' : ' with error'
            }`
          );
          return false;
        }, ignoreErrors);
      } else if (
        force ||
        this.index.uri.length == 0 ||
        (this.modifiedTime && this.modifiedTime > this.index.timestamp)
      ) {
        File.event.emit(File.Event.Start, `Caching ${this.index.path}`);
        this.index.status = Index.IndexEntry.State.PreparingCache;
        await this.exponentialBackoff(async () => {
          try {
            const files = await this.fetchAsHtmlIfPossible();
            const deleted: string[] = [];
            for (const uri in this.index.uri) {
              if (!Object.keys(files).includes(path.basename(uri))) {
                File.event.emit(File.Event.Start, `${uri} expired`);
                const file = bucket.file(
                  path.join(this.index.path, path.basename(uri))
                );
                try {
                  await file.delete();
                  deleted.push(uri);
                  File.event.emit(
                    File.Event.Succeed,
                    `${file.name} expired and deleted`
                  );
                } catch (error) {
                  File.event.emit(
                    File.Event.Fail,
                    Helper.errorMessage(
                      `Error deleting ${file.name}`,
                      { driveId: this.id },
                      error
                    )
                  );
                }
              }
            }
            this.index.uri = this.index.uri.filter(
              (uri) => !deleted.includes(uri)
            );
            for (const subfileName in files) {
              await this.exponentialBackoff(async () => {
                let filename = File.normalizeSubfileName(
                  this.index.path,
                  subfileName
                );
                File.event.emit(File.Event.Start, `Caching ${filename}`);
                const file = bucket.file(filename);
                const blob = await pipelineHTML({
                  file: this,
                  blob: (files as Record<string, Blob>)[subfileName] // TODO better fix than manual typing
                });
                file.save(Buffer.from(await blob.arrayBuffer()));
                if (!this.index.uri.includes(file.cloudStorageURI.href)) {
                  this.index.uri.push(file.cloudStorageURI.href);
                }
                File.event.emit(File.Event.Succeed, `${filename} cached`);
              }, ignoreErrors);
            }
            this.index.status = Index.IndexEntry.State.Cached;
          } catch (error) {
            this.index.status = error.message || 'error';
            File.event.emit(
              File.Event.Fail,
              Helper.errorMessage(this.index.path, { driveId: this.id }, error)
            );
          }
        }, ignoreErrors);
      }
    }
    return this;
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
        File.event.emit(
          File.Event.Start,
          `Adding ${permission.displayName} to ACL for ${this.index.path}`
        );
        let entity: string;
        switch (permission.type) {
          case 'group':
            entity = `group-${permission.emailAddress}`;
            break;
          case 'user':
            entity = `user-${permission.emailAddress}`;
            break;
          default:
            throw new Error(
              `Cannot handle permission type ${permission.type} (driveId: ${this.id}, emailAddress: ${permission.emailAddress})`
            );
        }
        await this.exponentialBackoff(async () => {
          await file.acl.add({
            entity,
            role: Google.Storage.acl.READER_ROLE
          });
          File.event.emit(
            File.Event.Succeed,
            `${entity} added as reader to ACL for ${this.index.path}`
          );
        }, ignoreErrors);
      }
    }
    this.index.update();
  }
}

namespace File {
  export enum Event {
    Start = 'start',
    Succeed = 'succeed',
    Fail = 'fail'
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
