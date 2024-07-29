import FileModule from './File';
import FolderModule from './Folder';
import IndexEntryModule from './IndexEntry';
import { JSONObject } from '@battis/typescript-tricks';
import fs from 'fs';

class Index extends Array<Index.File | Index.Folder> {
  protected constructor(...items: (Index.File | Index.Folder)[]) {
    super();
    this.push(...items);
  }

  public static async fromFile(filePath: string) {
    const obj = JSON.parse(fs.readFileSync(filePath).toString());
    if (Array.isArray(obj)) {
      return new Index(
        ...(await Promise.all(
          obj.map(async (e: JSONObject) => {
            const file = await Index.File.fromDrive(e);
            if (Index.Folder.isFolder(file)) {
              return await Index.Folder.fromDrive(file);
            }
            return file;
          })
        ))
      );
    }
    return [] as Index;
  }

  public get root(): Index.Folder | undefined {
    return this.find(
      (f) => f.index.path == '.' && Index.Folder.isFolder(f)
    ) as Index.Folder;
  }
}

namespace Index {
  export import File = FileModule;
  export import Folder = FolderModule;
  export import IndexEntry = IndexEntryModule;
}

export default Index;
