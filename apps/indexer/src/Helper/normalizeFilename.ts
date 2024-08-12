import valid from './validGCSFilenameCharacters';

const invalid = new RegExp(`[^${valid}]+`, 'gi');

/**
 * Backwards-compatible with Overdrive.io naming scheme
 */
export default function normalizeFilename(filename: string): string {
  return filename!
    .replace('&', 'and')
    .replace(invalid, '-')
    .replace(/-+/, '-')
    .replace(/-+$/, '')
    .toLowerCase();
}
