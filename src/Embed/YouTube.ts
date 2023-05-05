import Helper from '../Helper';

const youTubeLink = 'a[href^="https://youtu"]';

/**
 * Replace YouTube links with the embedded video
 *
 * This looks for paragraphs that contain YouTube links and then replace the entire paragraph with the embedded video. Thus, YouTube links should be set out from other text (not inline), but could include a preview thumbnail as well in the document for visual clarity. (For example, use https://youtube-thumbnail-grabber.com/ to download a thumbnail and https://fbutube.com/add-play-button-to-image to add a play button.) A paragraph would look like this:
 *
 * ```html
 * <p><img src="VIDEO_THUMBNAIL"/><br/>
 * <a href="VIDEO_URL">VIDEO_URL</a></p>
 * ```
 */
export default function YouTube() {
  Helper.waitForSelector(`p:has(${youTubeLink})`).then((paragraphs) => {
    paragraphs.forEach((p) => {
      const link = p.querySelector(youTubeLink) as HTMLAnchorElement;
      const url = link.href;
      const id = link.href.replace(
        /^https:\/\/(?:youtu\.be)|(?:(?:www\.)?youtube\.com\/watch\?v=)\/(.+)\/?/,
        '$1'
      );
      p.outerHTML = `<iframe width="100%" height="315" src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      Helper.log(`embedded ${url}`);
    });
  });
}
