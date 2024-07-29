//import * as QRCode from 'qrcode';
import Helper from '../../../Helper';
import icon from './chrome-web-store.png';
import styles from './styles.module.scss';
import './styles.scss';

const chromeWebStore = 'a[href^="https://chromewebstore.google.com/"]';

export default function ChromeWebStore() {
  Helper.onGoogleDocEmbed<HTMLParagraphElement>(
    `p:has(${chromeWebStore})`,
    (paragraphs) => {
      paragraphs.forEach((p) => {
        const link = p.querySelector(chromeWebStore) as HTMLAnchorElement;
        const url = link.href;
        const text = link.innerText;
        p.innerHTML = `
          <form action="${url}" method="get" target="_blank">
            <button class="${styles.chromeWebStore}" type="submit">
              ${text} in the Chrome Web Store
            </button>
          </form>
       `;
        Helper.log(`Embedded link to ${text} in Chrome Web Store`);
      });
    }
  );
}
