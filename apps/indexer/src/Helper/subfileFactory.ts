import { Bucket } from '@google-cloud/storage';

export function subfileFactory(bucket: Bucket) {
  return (uri: string) => {
    const uriPath = uri.replace(/^gs:\/\/[^/]+\//, '');
    return bucket.file(uriPath);
  };
}
