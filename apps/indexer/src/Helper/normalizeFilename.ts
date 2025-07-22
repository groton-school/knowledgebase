import { validGCSFilenameCharacters } from './validGCSFilenameCharacters.js';

const invalid = new RegExp(`[^${validGCSFilenameCharacters}]+`, 'gi');

/** Backwards-compatible with Overdrive.io naming scheme */
export function normalizeFilename(filename: string): string {
  return filename!
    .replace('&', 'and')
    .replace(invalid, '-')
    .replace(/-+/, '-')
    .replace(/-+$/, '')
    .toLowerCase();
}
