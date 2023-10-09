import Helper from '../../../Helper';
import './styles.scss';

export default function Image() {
  Helper.onGoogleDocEmbed('p', (paragraphs) => {
    paragraphs
      .filter((p) =>
        /^<img[^>]+src=["'“”‘’][^"'“”‘’]+["'“”‘’][^>]*\/?>$/.test(p.innerText)
      )
      .forEach((img) => {
        const url = Helper.straightenCurlyQuotes(img.innerText).replace(
          /^.*src="([^"]+)".*$/,
          '$1'
        );
        img.outerHTML = Helper.straightenCurlyQuotes(img.innerText);
        Helper.log(`embedded 🖼️ ${url}`);
      });
  });
}
