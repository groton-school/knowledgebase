import Helper from '../../Helper';

const youTubeLink =
  'a[href*="youtu.be"]:not([href*="playlist"]), a[href*="youtube.com"]:not([href*="playlist"])';
const playlistLink = 'a[href^="https://youtube.com/playlist"]';

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
  Helper.onGoogleDocEmbed(`p:has(${youTubeLink})`, (paragraphs) => {
    paragraphs.forEach((p) => {
      const link = p.querySelector(youTubeLink) as HTMLAnchorElement;
      const url = link.href;
      const id = link.href.replace(
        /^https:\/\/(?:youtu\.be)|(?:(?:www\.)?youtube\.com\/watch\?v=)\/(.+)\/?/,
        '$1'
      );
      p.replaceWith(
        Helper.iframe(
          `https://www.youtube-nocookie.com/embed/${id}`,
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        )
      );
      Helper.log(`embedded ${url}`);
    });
  });
  Helper.onGoogleDocEmbed(`p:has(${playlistLink})`, (paragraphs) => {
    paragraphs.forEach((p) => {
      const link = p.querySelector(playlistLink) as HTMLAnchorElement;
      const url = link.href;
      const id = link.href.replace(
        /^https:\/\/youtube.com\/playlist\?list=(.+)\/?/,
        '$1'
      );
      Helper.log(`I think ${id} is the playlis id?`);
      p.replaceWith(
        Helper.iframe(
          `https://www.youtube.com/embed/videoseries?list=${id}`,
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        )
      );
      Helper.log(`embedded ${url}`);
    });
  });
}
