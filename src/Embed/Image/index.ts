import Helper from '../../Helper';
import './styles.scss';

export default function Image() {
  Helper.onGoogleDocEmbed('p').then((paragraphs) => {
    paragraphs
      .filter((p) => /^<img[^>]+src="[^"]+"[^>]*\/?>$/.test(p.innerText))
      .forEach((img) => (img.outerHTML = img.innerText));
  });
}
