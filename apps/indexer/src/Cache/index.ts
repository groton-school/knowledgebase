import _File from './File';
import _FileFactory from './FileFactory';
import _IndexEntry from './IndexEntry';
import Index from '@groton/knowledgebase.index';

namespace Cache {
  export import File = _File;
  export const FileFactory = _FileFactory;
  export import IndexEntry = _IndexEntry;
  export const fromFile: (
    filePath: string
  ) => Promise<Index.Index<Cache.File>> = Index.fromFile.bind(null, Cache.File);
}

export default Cache;
