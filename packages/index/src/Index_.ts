import { File } from './File.js';

export class Index<F extends File> extends Array<F> {
  public constructor(...items: F[]) {
    super();
    this.push(...items);
  }

  public get root() {
    return this.find((f) => f.index.path == '.' && f.isFolder());
  }
}
