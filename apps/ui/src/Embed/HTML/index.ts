import { IFrame } from './IFrame';
import { Image } from './Image';

/**
 * Convert select HTML text into DOM elements
 *
 * All convertible HTML text must be the _only_ text content of a paragraph.
 * Adding whitespace at the start of the paragraph will disable the conversion
 * (although whitespace at the end of the paragraph will be trimmed by the
 * Google Docs API and thus ignored.
 */
export function HTML() {
  IFrame();
  Image();
}
