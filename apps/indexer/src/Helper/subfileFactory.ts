import { Bucket } from '@google-cloud/storage';

export default function subfileFactory(bucket: Bucket) {
  return (uri: string) => {
    let uriPath = uri.replace(/^gs:\/\/[^\/]+\//, '');
    return bucket.file(uriPath);
  };
}
