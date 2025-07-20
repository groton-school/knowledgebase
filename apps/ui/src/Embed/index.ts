import { HTML } from './HTML';
import { Hyperlinks } from './Hyperlinks';

/**
 * Convert content in Google Docs into DOM elements
 *
 * The markdown-like goal of this is to write Google Docs that are readable, but
 * that can be rendered with richer content where possible. To this end some
 * HTML text will be converted to actual DOM elements, and hyperlinks to some
 * types of content will be converted to embedded content.
 */
export function Embed() {
  HTML();
  Hyperlinks();
}
