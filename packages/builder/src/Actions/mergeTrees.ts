import File from '../Schema/File';
import Folder, { isFile } from '../Schema/Folder';

function mergeTrees(prev: Folder | File, next: Folder): Folder {
  if (isFile(prev)) {
    return next;
  }
  const merged = next;
  for (const filename of Object.keys(next)) {
    const prevFile = prev[filename];
    const nextFile = next[filename];
    if (isFile(nextFile)) {
      if (isFile(prevFile) && prevFile.index) {
        merged[filename].index = prevFile.index;
      }
    } else {
      merged[filename] = mergeTrees(prevFile, nextFile);
    }
  }
  return merged;
}

export default mergeTrees;
