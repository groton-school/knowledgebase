import { JSONObject } from '@battis/typescript-tricks';
import fs from 'node:fs';
import { File } from './File.js';
import { FileFactory } from './FileFactory.js';

export * from './File.js';
export * from './FileFactory.js';
export * from './IndexEntry.js';

export class Index<T extends File> extends Array<T> {
  public constructor(...items: T[]) {
    super();
    this.push(...items);
  }

  public get root() {
    return this.find((f) => f.index.path == '.' && f.isFolder());
  }

  static async fromFile<T extends typeof File>(
    fileType: T,
    filePath: string,
    permissionsRegex?: RegExp
  ): Promise<Index<InstanceType<T>>> {
    const fileFactory = new FileFactory(fileType);
    const obj = JSON.parse(fs.readFileSync(filePath).toString());
    if (Array.isArray(obj)) {
      return new Index<InstanceType<T>>(
        ...(
          await Promise.allSettled(
            obj.map(async (e: JSONObject) => {
              return await fileFactory.fromDrive(e, permissionsRegex);
            })
          )
        ).reduce((all, result) => {
          if (result.status === 'fulfilled') {
            all.push(result.value);
          }
          return all;
        }, [] as InstanceType<T>[])
      );
    }
    return new Index<InstanceType<T>>(...[]);
  }
}
