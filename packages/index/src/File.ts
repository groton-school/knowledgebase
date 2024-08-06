import IndexEntry from './IndexEntry';
import { JSONObject } from '@battis/typescript-tricks';
import Google from '@groton/knowledgebase.google';

type Nonoptional<T> = Exclude<T, null | undefined>;

export type IdType = Nonoptional<Google.Drive.drive_v3.Schema$File['id']>;
export type NameType = Nonoptional<Google.Drive.drive_v3.Schema$File['name']>;

interface File extends Google.Drive.drive_v3.Schema$File {}

class File {
  public readonly id: IdType;
  public readonly name: NameType;
  public readonly description: Google.Drive.drive_v3.Schema$File['description'];
  public readonly modifiedTime: Google.Drive.drive_v3.Schema$File['modifiedTime'];
  public readonly permissions: Google.Drive.drive_v3.Schema$File['permissions'];
  public readonly mimeType: Google.Drive.drive_v3.Schema$File['mimeType'];
  public index: IndexEntry;

  public constructor(
    {
      id,
      name,
      index = undefined,
      ...rest
    }: Google.Drive.drive_v3.Schema$File & { index?: IndexEntry },
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

  public isFolder() {
    return this.mimeType == Google.MimeTypes.Folder;
  }
}

namespace File {}

export default File;
