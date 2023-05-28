import Helper from '../../Helper';

/**
 * Replace `iframe` HTML tags with the actual HMTL
 *
 * Some content provides an `iframe` tag that will embed it (many video sites,
 * for example). This will look for paragraphs that are made up _exclusively_
 * of an `iframe` tag (no other content) and replace it with the provided
 * `iframe` HTML. A suggested way of handling this would be something like
 * this:
 *
 * ```html
 * <p><span style="font-size: 1px; color: white"><iframe width="560"
 * height="315" src="https://www.youtube-nocookie.com/embed/Jii84wxBUSw"
 * title="YouTube video player" frameborder="0" allow="accelerometer;
 * autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;
 * web-share" allowfullscreen>PLACEHOLDER</iframe></span></p>
 * ```
 *
 * The `PLACEHOLDER` above could really be anything -- text, image, link --
 * since it will be replaced by the `iframe` when rendered. Note that the
 * HTML code itself is 1px and white to make it less obtrusive in the Google
 * Doc.
 */
export default function IFrame() {
  Helper.onGoogleDocEmbed('p', (paragraphs: HTMLElement[]) => {
    paragraphs.forEach((p) => {
      if (/^<iframe.*<\/iframe>$/.test(p.innerText)) {
        const url = p.innerText.replace(/^.*src="([^"]+)".*$/, '$1');
        p.outerHTML = p.innerText;
        Helper.log(`embedded ${url}`);
      }
    });
  });
}
