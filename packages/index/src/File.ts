import { JSONObject } from '@battis/typescript-tricks';
import { Google } from '@groton/knowledgebase.google';
import { IndexEntry } from './IndexEntry.js';

type Nonoptional<T> = Exclude<T, null | undefined>;

export type Id = Nonoptional<Google.Drive.drive_v3.Schema$File['id']>;
export type Name = Nonoptional<Google.Drive.drive_v3.Schema$File['name']>;

export class File implements Google.Drive.drive_v3.Schema$File {
  public static fields: (keyof Google.Drive.drive_v3.Schema$File)[] = [
    'id',
    'name',
    'fileExtension',
    'mimeType',
    'description',
    'parents',
    'permissions',
    'modifiedTime',
    'shortcutDetails',
    'webViewLink'
  ];

  public readonly id: Id;
  public readonly name: Name;
  public readonly fileExtension: Google.Drive.drive_v3.Schema$File['fileExtension'];
  public readonly mimeType: Google.Drive.drive_v3.Schema$File['mimeType'];
  public readonly description: Google.Drive.drive_v3.Schema$File['description'];
  public readonly parents: Google.Drive.drive_v3.Schema$File['parents'];
  public readonly modifiedTime: Google.Drive.drive_v3.Schema$File['modifiedTime'];
  public readonly shortcutDetails: Google.Drive.drive_v3.Schema$File['shortcutDetails'];
  public readonly webViewLink: Google.Drive.drive_v3.Schema$File['webViewLink'];

  public permissions: Google.Drive.drive_v3.Schema$File['permissions'];

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
    if (!rest.permissions) {
      throw new Error(
        `Attempted to instantiate a file without access to permissions information: ${JSON.stringify(
          {
            id,
            name,
            ...rest,
            index
          }
        )}`
      );
    }
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
