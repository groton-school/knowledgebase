import FileModule from './File';
import Index from '@groton/knowledgebase.index';

class Cache extends Index<Cache.File> {}

namespace Cache {
  export import File = FileModule;
  export const FileFactory = Index.FileFactory;
  export import IndexEntry = Index.IndexEntry;
  export import fromFile = Index.fromFile;
}

export default Cache;
