import FileModule from './File';
import FileFactoryModule from './FileFactory';
import IndexEntryModule from './IndexEntry';
import Index from '@groton/knowledgebase.index';

class Cache extends Index<Cache.File> {}

namespace Cache {
  export import File = FileModule;
  export const FileFactory = FileFactoryModule;
  export import IndexEntry = IndexEntryModule;
  export import fromFile = Index.fromFile;
}

export default Cache;
