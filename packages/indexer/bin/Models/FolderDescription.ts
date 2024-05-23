import { drive_v3 } from 'googleapis';

export type FileDescription = drive_v3.Schema$File;

type FolderDescription = {
  '.': FileDescription & { mimeType: 'application/vnd.google-apps.folder' };
  [name: string]: FileDescription | FolderDescription;
};
export default FolderDescription;
