import { drive_v3 } from '@googleapis/drive';

export type FileDescription = drive_v3.Schema$File & {
  index?: {
    status?: string;
    uploaded: boolean;
    uri?: string;
    timestamp: string;
  };
};

export default FileDescription;
