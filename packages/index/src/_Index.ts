import File from './File.js';

export default class Index<T extends File> extends Array<T> {
  public constructor(...items: T[]) {
    super();
    this.push(...items);
  }

  public get root() {
    return this.find((f) => f.index.path == '.' && f.isFolder());
  }
}
