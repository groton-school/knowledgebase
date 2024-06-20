import FileDescription from './FileDescription';

type FolderDescription = {
  '.': FileDescription & { mimeType: 'application/vnd.google-apps.folder' };
  [name: string]: FileDescription | FolderDescription;
};

export function isFileDescription(
  obj: FileDescription | FolderDescription
): obj is FileDescription {
  return !('.' in obj);
}

export default FolderDescription;
