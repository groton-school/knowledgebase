import FileModule from './File';
import FileFactoryModule from './FileFactory';
import IndexEntryModule from './IndexEntry';
import IndexModule from './Index_';
import { JSONObject } from '@battis/typescript-tricks';
import fs from 'fs';

class Index<T extends Index.File> extends IndexModule<T> {}

namespace Index {
  export import File = FileModule;
  export import FileFactory = FileFactoryModule;
  export import IndexEntry = IndexEntryModule;
  export async function fromFile<T extends typeof File = typeof File>(
    filePath: string,
    fileType: T
  ) {
    const fileFactory = new FileFactory(fileType);
    const obj = JSON.parse(fs.readFileSync(filePath).toString());
    if (Array.isArray(obj)) {
      return new Index<InstanceType<T>>(
        ...(await Promise.all(
          obj.map(async (e: JSONObject) => {
            return await fileFactory.fromDrive(e);
          })
        ))
      );
    }
    return new Index<InstanceType<T>>(...[]);
  }
}

export default Index;
