import FileDescription from './FileDescription';

type FolderDescription = {
  '.': FileDescription & { mimeType: 'application/vnd.google-apps.folder' };
  [name: string]: FileDescription | FolderDescription;
};
export default FolderDescription;
