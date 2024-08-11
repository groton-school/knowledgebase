import Helper from '../Helper';
import pipelineHTML from './Actions/pipelineHTML';
import FileFactory from './FileFactory';
import IndexEntry from './IndexEntry';
import Google from '@groton/knowledgebase.google';
import Index from '@groton/knowledgebase.index';
import Zip from 'adm-zip';
import events from 'events';
import mime from 'mime-types';
import path from 'path';

const DEFAULT_PERMISSIONS_REGEX = /.*/;
const DEFAULT_FORCE = false;
const DEFAULT_IGNORE_ERRORS = true;

interface File extends Index.File {
  permissions: (Google.Drive.drive_v3.Schema$Permission & {
    indexerAclState?: IndexEntry.State;
  })[];
}

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

  /**
   * TODO _re_ index non-destructively
   * TODO delete/rename cached files
   */
  public async indexContents(): Promise<File[]> {
    if (this.isFolder()) {
      let contents: File[] = [];
      let folderContents: Google.Drive.drive_v3.Schema$FileList = {};
      const fileFactory = new FileFactory(File);

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
              new IndexEntry(this.index.path)
            );
            file.index = new IndexEntry(
              path.join(this.index.path, Helper.normalizeFilename(file.name))
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
      const subfile = Helper.subfileFactory(bucket);

      if (!this.index.exists) {
        File.event.emit(File.Event.Start, `${this.index.path} expired`);
        let success = true;
        await Helper.exponentialBackoff(async () => {
          for (const uri of this.index.uri) {
            File.event.emit(File.Event.Start, `${uri} expired`);
            const file = subfile(uri);
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
        this.index.status = IndexEntry.State.PreparingCache;
        await Helper.exponentialBackoff(async () => {
          try {
            const files = await this.fetchAsHtmlIfPossible();
            const deleted: string[] = [];
            for (const uri in this.index.uri) {
              if (
                !Object.keys(files).includes(
                  uri.replace(new RegExp(`^.*${this.index.path}/(.*)$`), '$1')
                )
              ) {
                File.event.emit(File.Event.Start, `${uri} expired`);
                const file = subfile(uri);
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
              await Helper.exponentialBackoff(async () => {
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
            this.index.status = IndexEntry.State.Cached;
          } catch (error) {
            this.index.status = error.message || 'error';
            File.event.emit(
              File.Event.Fail,
              Helper.errorMessage(
                `${this.index.path}`,
                { driveId: this.id },
                error
              )
            );
          }
        }, ignoreErrors);
      }
    }
    return this;
  }

  public async cacheACL({
    bucketName,
    permissionsRegex = DEFAULT_PERMISSIONS_REGEX,
    ignoreErrors = DEFAULT_IGNORE_ERRORS
  }: File.Params.Cache) {
    if (!this.isFolder()) {
      const bucket = Google.Client.getStorage().bucket(bucketName);
      const subfile = Helper.subfileFactory(bucket);
      let updatedPermissions = this.permissions;
      for (const permission of this.permissions!.filter(
        (p) =>
          p.emailAddress &&
          p.indexerAclState != IndexEntry.State.Cached &&
          new RegExp(permissionsRegex || '.*').test(p.emailAddress)
      )) {
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

        if (permission.indexerAclState == IndexEntry.State.Expired) {
          File.event.emit(
            File.Event.Start,
            `Removing ${permission.displayName} from ACL for ${this.index.path}`
          );
          try {
            for (const uri of this.index.uri) {
              const file = subfile(uri);
              File.event.emit(File.Event.Start, file.name);
              await file.acl.delete({ entity });
              updatedPermissions = updatedPermissions.splice(
                updatedPermissions.findIndex(
                  (p) => p.emailAddress == permission.emailAddress
                ),
                1
              );
              File.event.emit(
                File.Event.Succeed,
                `${permission.type}:${permission.emailAddress} removed from ACL for ${this.index.path}`
              );
            }
          } catch (error) {
            permission.indexerAclState = error.message || 'error';
            updatedPermissions.push(permission);
            File.event.emit(
              File.Event.Fail,
              Helper.errorMessage(
                `Error removing ${permission.emailAddress} from ACL`,
                { entity, driveId: this.id },
                error
              )
            );
          }
        } else {
          File.event.emit(
            File.Event.Start,
            `Adding ${permission.displayName} to ACL for ${this.index.path}`
          );
          await Helper.exponentialBackoff(async () => {
            for (const uri of this.index.uri) {
              const file = subfile(uri);
              File.event.emit(
                File.Event.Succeed,
                `${permission.type}:${permission.emailAddress} added as reader to ACL for /${file.name}`
              );
              try {
                await file.acl.add({
                  entity,
                  role: Google.Storage.acl.READER_ROLE
                });
                File.event.emit(
                  File.Event.Succeed,
                  `${permission.type}:${permission.emailAddress} added as reader to ACL for /${file.name}`
                );
              } catch (error) {
                File.event.emit(
                  File.Event.Fail,
                  Helper.errorMessage(
                    'Error adding reader to ACL',
                    {
                      driveId: this.id,
                      file: file.name,
                      email: permission.emailAddress
                    },
                    error
                  )
                );
              }
            }
            permission.indexerAclState = IndexEntry.State.Cached;
            updatedPermissions.push(permission);
          }, ignoreErrors);
        }
      }
      this.permissions = updatedPermissions;
    }
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
