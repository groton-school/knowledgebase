import Config from './Config';
import crypto from 'crypto';

export default function createDefault({
  bucket = process.env.BUCKET
} = {}): Config {
  return {
    session: { secret: crypto.randomUUID() },
    storage: { bucket: bucket || (process.env.BUCKET as string) }
  };
}
