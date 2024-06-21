import File from './File';

type Folder = {
  '.': File & { mimeType: 'application/vnd.google-apps.folder' };
  [name: string]: File | Folder;
};

export function isFile(obj: File | Folder): obj is File {
  return !('.' in obj);
}

export default Folder;
