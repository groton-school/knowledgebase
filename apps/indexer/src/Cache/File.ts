import cli from '@battis/qui-cli';
import { CoerceError } from '@battis/typescript-tricks';
import Google from '@groton/knowledgebase.google';
import Index from '@groton/knowledgebase.index';
import Zip from 'adm-zip';
import mime from 'mime-types';
import events from 'node:events';
import path from 'node:path';
import Helper from '../Helper/index.js';
import pipelineHTML from './Actions/pipelineHTML.js';
import FileFactory from './FileFactory.js';
import IndexEntry from './IndexEntry.js';

class File extends Index.File {
  protected static readonly DEFAULT_PERMISSIONS_REGEX = /.*/;
  protected static readonly DEFAULT_FORCE = false;
  protected static readonly DEFAULT_IGNORE_ERRORS = true;

  public static event = new events.EventEmitter();

  public static bindSpinner(
    spinner: ReturnType<typeof cli.spinner>,
    transform?: (t: string) => string
  ) {
    for (const key in this.Event) {
      const eventType = this.Event[key];
      const spinnerMember = spinner[eventType];
      if (typeof spinnerMember == 'function' && spinnerMember.length == 1) {
        this.event.on(eventType, (status: string): void => {
          (
            spinnerMember.bind(spinner) as (
              text?: string
            ) => ReturnType<typeof cli.spinner>
          )(transform ? transform(status) : status);
        });
      } else {
        this.event.on(eventType, (status: string): void => {
          spinner.info(transform ? transform(status) : status);
        });
      }
    }
  }

  public async fetchAsHtmlIfPossible() {
    switch (this.mimeType) {
      case Google.MimeTypes.Doc:
      case Google.MimeTypes.Sheet:
      case Google.MimeTypes.Slides:
        try {
          return await this.fetchAsCompleteHtml();
        } catch (e) {
          const error = CoerceError(e);
          if (error.message == 'This file is too large to be exported.') {
            if (this.webViewLink) {
              return await Helper.renderBlob(
                path.join(import.meta.dirname, 'Views/shortcut.ejs'),
                this
              );
            } else {
              return await Helper.renderBlob(
                path.join(import.meta.dirname, 'Views/tooLarge.ejs'),
                this
              );
            }
          } else {
            throw error;
          }
        }
      default:
        return {
          '.': (
            await (
              await Google.Client.getDrive()
            ).files.get({
              fileId: this.id!,
              alt: 'media',
              supportsAllDrives: true
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

  public async indexContents(permissionsRegex: RegExp): Promise<File[]> {
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
            includeTeamDriveItems: true,
            pageToken: folderContents?.nextPageToken || undefined
          })
        ).data;

        if (folderContents.files?.length) {
          contents.push(
            ...(
              await Promise.allSettled(
                folderContents.files.map(async (item) => {
                  if (!item.name) {
                    throw new Error(`${item.id} is unnamed`);
                  }
                  File.event.emit(
                    File.Event.Start,
                    `Indexing ${path.join(this.index.path, item.name)}`
                  );
                  const file = await fileFactory.fromDriveId(
                    item.id!,
                    permissionsRegex,
                    new IndexEntry(this.index.path)
                  );
                  file.index = new IndexEntry(
                    path.join(
                      this.index.path,
                      Helper.normalizeFilename(file.name)
                    )
                  );
                  if (file.isFolder()) {
                    contents.push(
                      ...(await file.indexContents(permissionsRegex))
                    );
                  }
                  File.event.emit(
                    File.Event.Succeed,
                    `${file.index.path} indexed`
                  );
                  return file;
                })
              )
            ).reduce((all, result) => {
              if (result.status == 'fulfilled') {
                all.push(result.value);
              } else {
                const error = Google.CoerceRequestError(result.reason);
                if (
                  error.code == 404 &&
                  'config' in error &&
                  typeof error.config == 'object' &&
                  error.config !== null &&
                  'url' in error.config &&
                  typeof error.config.url == 'string'
                ) {
                  const id = path.basename(new URL(error.config.url).pathname);
                  File.event.emit(
                    File.Event.Fail,
                    `Could not index file ID ${id} (likely a broken shortcut)`
                  );
                }
              }
              return all;
            }, [] as File[])
          );
        }
      } while (folderContents.nextPageToken);
      return contents;
    }
    return [];
  }

  public async cache({
    bucketName,
    force = File.DEFAULT_FORCE,
    ignoreErrors = File.DEFAULT_IGNORE_ERRORS
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
            } catch (e) {
              const error = Google.CoerceRequestError(e);
              if (error.code != '404') {
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
            for (const uri of this.index.uri) {
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
          } catch (e) {
            const error = CoerceError(e);
            this.index.status = error.message;
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
}

namespace File {
  export const Event: Record<string, keyof ReturnType<typeof cli.spinner>> = {
    Start: 'start',
    Succeed: 'succeed',
    Fail: 'fail',
    Warn: 'warn',
    Info: 'info'
  };

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
