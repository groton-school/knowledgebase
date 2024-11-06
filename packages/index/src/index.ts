import { JSONObject } from '@battis/typescript-tricks';
import fs from 'node:fs';
import _File from './File.js';
import _FileFactory from './FileFactory.js';
import _IndexEntry from './IndexEntry.js';
import _Index from './_Index.js';

namespace Index {
  export type Index<T extends Index.File> = _Index<T>;
  export import File = _File;
  export import FileFactory = _FileFactory;
  export import IndexEntry = _IndexEntry;
  export async function fromFile<T extends typeof File>(
    fileType: T,
    filePath: string,
    permissionsRegex?: RegExp
  ): Promise<Index<InstanceType<T>>> {
    const fileFactory = new _FileFactory(fileType);
    const obj = JSON.parse(fs.readFileSync(filePath).toString());
    if (Array.isArray(obj)) {
      return new _Index<InstanceType<T>>(
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
    return new _Index<InstanceType<T>>(...[]);
  }
}

export default Index;
