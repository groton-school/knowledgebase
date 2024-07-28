import { JSONObject } from '@battis/typescript-tricks';

class IndexEntry {
  private _timestamp: string;

  public constructor(
    private _path: string = '.',
    private _status: string = IndexEntry.State.Indexed,
    private _uri: string[] = [],
    private _exists: boolean = true
  ) {
    this._timestamp = new Date().toISOString();
  }

  public static fromJSON({ path, status, uri, exists, timestamp }: JSONObject) {
    const entry = new IndexEntry(path, status, uri, exists);
    entry._timestamp = timestamp;
    return entry;
  }

  public update() {
    this._timestamp = new Date().toISOString();
  }

  public get timestamp() {
    return this._timestamp;
  }

  public get path() {
    return this._path;
  }

  public set path(value) {
    this._path = value;
    this.update();
  }

  public get status() {
    return this._status;
  }

  public set status(value) {
    this._status = value;
    this.update();
  }

  public get uri() {
    return this._uri;
  }

  public set uri(value) {
    this._uri = value;
    this.update();
  }

  public get exists() {
    return this._exists;
  }

  public set exists(value) {
    this._exists = value;
    this.update;
  }

  public toJSON() {
    return {
      path: this.path,
      status: this.status,
      uri: this.uri,
      exists: this.exists,
      timestamp: this.timestamp
    };
  }
}

namespace IndexEntry {
  export namespace State {
    export const Indexed = 'indexed';
    export const PreparingCache = 'preparing cache';
    export const Cached = 'cached';
  }
}

export default IndexEntry;
