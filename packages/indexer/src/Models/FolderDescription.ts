import { drive_v3 } from '@googleapis/drive';

export type FileDescription = drive_v3.Schema$File & {
  index?: {
    status?: string;
    uploaded: boolean;
    url?: string;
    timestamp: string;
  };
};

type FolderDescription = {
  '.': FileDescription & { mimeType: 'application/vnd.google-apps.folder' };
  [name: string]: FileDescription | FolderDescription;
};
export default FolderDescription;
