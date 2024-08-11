import _File from './File';
import _FileFactory from './FileFactory';
import _IndexEntry from './IndexEntry';
import Index from '@groton/knowledgebase.index';

namespace ACL {
  export import File = _File;
  export const FileFactory = _FileFactory;
  export import IndexEntry = _IndexEntry;
  export const fromFile: (filePath: string) => Promise<Index.Index<ACL.File>> =
    Index.fromFile.bind(null, ACL.File);
}

export default ACL;
