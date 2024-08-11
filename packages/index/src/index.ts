import _File from './File';
import _FileFactory from './FileFactory';
import _IndexEntry from './IndexEntry';
import _Index from './_Index';
import { JSONObject } from '@battis/typescript-tricks';
import fs from 'fs';

namespace Index {
  export type Index<T extends Index.File> = _Index<T>;
  export import File = _File;
  export import FileFactory = _FileFactory;
  export import IndexEntry = _IndexEntry;
  export async function fromFile<T extends typeof File>(
    fileType: T,
    filePath: string
  ): Promise<_Index<InstanceType<T>>> {
    const fileFactory = new _FileFactory(fileType);
    const obj = JSON.parse(fs.readFileSync(filePath).toString());
    if (Array.isArray(obj)) {
      return new _Index<InstanceType<T>>(
        ...(await Promise.all(
          obj.map(async (e: JSONObject) => {
            return await fileFactory.fromDrive(e);
          })
        ))
      );
    }
    return new _Index<InstanceType<T>>(...[]);
  }
}

export default Index;
