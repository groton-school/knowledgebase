import { JSONObject } from '@battis/typescript-tricks';

export enum State {
  Indexed = 'indexed',
  PreparingCache = 'preparing cache',
  Cached = 'cached',
  Expired = 'expired',
  Dynamic = 'dynamic'
}

export class IndexEntry {
  private _timestamp: string;

  public constructor(
    private _path: string = '.',
    private _status: string = State.Indexed,
    private _uri: string[] = [],
    private _exists: boolean = true,
    private _hidden: boolean = false
  ) {
    this._timestamp = new Date().toISOString();
  }

  public static fromJSON({ path, status, uri, exists, timestamp }: JSONObject) {
    const entry = new IndexEntry(
      path as string,
      status as string,
      uri as string[],
      exists as boolean
    );
    entry._timestamp = timestamp as string;
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
    this.update();
  }

  public get hidden() {
    return this._hidden;
  }

  public set hidden(value) {
    this._hidden = value;
    this.update();
  }

  public toJSON() {
    const json: JSONObject = {
      path: this.path,
      status: this.status,
      uri: this.uri,
      exists: this.exists,
      timestamp: this.timestamp
    };
    if (this.hidden) {
      json.hidden = this.hidden;
    }
    return json;
  }
}
