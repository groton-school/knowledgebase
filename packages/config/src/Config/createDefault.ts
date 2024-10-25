import * as crypto from 'node:crypto';
import { Config } from './Config.js';

export default function createDefault({
  bucket = process.env.BUCKET
} = {}): Config {
  return {
    session: { secret: crypto.randomUUID() },
    storage: { bucket: bucket || (process.env.BUCKET as string) }
  };
}
