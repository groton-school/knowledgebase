class IndexEntry {
  public readonly timestamp: string;

  public constructor(
    public path: string = '.',
    public status: string = IndexEntry.State.Indexed,
    public uri: string[] = [],
    public exists: boolean = true
  ) {
    this.timestamp = new Date().toISOString();
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
