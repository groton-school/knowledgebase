import File from './File';
import Folder from './Folder';
import IndexEntry from './IndexEntry';
import { JSONObject } from '@battis/typescript-tricks';
import fs from 'fs';

export function fromFile(filePath: string): (File | Folder)[] {
  return JSON.parse(fs.readFileSync(filePath).toString()).map((e: JSONObject) =>
    Folder.isFolderData(e) ? Folder.fromJSON(e) : File.fromJSON(e)
  );
}

export function extractRoot(index: (File | Folder)[]): Folder | undefined {
  const roots = index.filter(
    (f) => f.index.path == '.' && Folder.isFolder(f)
  ) as Folder[];
  if (roots.length) {
    return roots[0];
  }
  return undefined;
}

export { File, Folder, IndexEntry };
