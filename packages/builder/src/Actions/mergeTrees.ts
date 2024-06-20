import FileDescription from '../Models/FileDescription';
import FolderDescription, {
  isFileDescription
} from '../Models/FolderDescription';

function mergeTrees(
  prev: FolderDescription | FileDescription,
  next: FolderDescription
): FolderDescription {
  if (isFileDescription(prev)) {
    return next;
  }
  const merged = next;
  for (const filename of Object.keys(next)) {
    const prevFile = prev[filename];
    const nextFile = next[filename];
    if (isFileDescription(nextFile)) {
      if (isFileDescription(prevFile) && prevFile.index) {
        merged[filename].index = prevFile.index;
      }
    } else {
      merged[filename] = mergeTrees(prevFile, nextFile);
    }
  }
  return merged;
}

export default mergeTrees;
