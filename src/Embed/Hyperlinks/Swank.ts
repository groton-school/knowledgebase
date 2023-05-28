import Helper from '../../Helper';

const swankLink = 'a[href^="https://swank.hubs.vidyard.com"]';

/**
 * Replace Swank support video links with the embedded video
 *
 * The model that works most effectively would be represented in simple HTML
 * as:
 *
 * ```html
 * <p><a href="VIDEO_URL">VIDEO_TITLE</a><br/>
 * <img src="VIDEO_THUMBNAIL"/><br/>
 * <a href="VIDEO_URL">VIDEO_URL</a></p>
 * ```
 *
 * This can be effectively created in a Google Doc by putting those elements
 * together in a single paragraph (perhaps with shift-enter linebreaks to
 * separate the lins), highlighting it all, and turning it into a link to the
 * video. Since Google Doc doesn't let you turn images into links, the
 * resulting is as described above.
 *
 * This can only handle one Swank link per paragraph because of this.
 *
 */
export default function Swank() {
  Helper.onGoogleDocEmbed(`p:has(${swankLink})`, (paragraphs) => {
    paragraphs.forEach((p) => {
      const url = (document.querySelector(swankLink) as HTMLAnchorElement).href;
      const id = url.replace(/.*\/watch\/(.*)\??/, '$1');
      p.replaceWith(Helper.iframe(`https://play.vidyard.com/${id}?autoplay=0`));
      Helper.log(`embedded ${url}`);
    });
  });
}
