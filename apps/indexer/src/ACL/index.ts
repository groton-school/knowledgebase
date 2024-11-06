import Index from '@groton/knowledgebase.index';
import _File from './File.js';
import _FileFactory from './FileFactory.js';
import _IndexEntry from './IndexEntry.js';

namespace ACL {
  export import File = _File;
  export const FileFactory = _FileFactory;
  export import IndexEntry = _IndexEntry;
  export const fromFile = (filePath: string, permissionsRegex?: RegExp) =>
    Index.fromFile<typeof File>(File, filePath, permissionsRegex);
}

export default ACL;
