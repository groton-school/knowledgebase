//import * as QRCode from 'qrcode';
import Helper from '../../../Helper';
import hideHeaderAndFooterStyles from '../../../UI/HideHeaderAndFooter/styles.scss';
import './styles.scss';
import styles from './styles.scss';

const appStore = 'a[href^="https://apps.apple.com/"]'; // TODO handle iTunes links too?
const playStore = 'a[href^="https://play.google.com/"]';

function embed(paragraphs: HTMLElement[]) {
  paragraphs.forEach((p) => {
    const ios = p.querySelector(appStore) as HTMLAnchorElement;
    const android = p.querySelector(playStore) as HTMLAnchorElement;
    const id = crypto.randomUUID();
    // TODO template
    p.outerHTML =
      `<div id="${id}" class="${hideHeaderAndFooterStyles.include}">` +
      `<div class="${styles.apps} ${hideHeaderAndFooterStyles.include}">` +
      (ios
        ? `<a class="${styles.ios}" href="${ios.href}" target="_blank"></a>`
        : '') +
      (android
        ? `<a class="${styles.android}" href="${android.href}" target="_blank"></a>`
        : '') +
      `</div>` +
      `</div>`;

    /*
     * TODO implement QRCodes
     *   Probably the most straight-forward approach is either to compile
     *   external libraries into my code (ugh) or externalize them and host
     *   them on GAE, which I believe is a white-listed script source in
     *   OverDrive
     */
    /*
    QRCode.toCanvas(
      document.querySelector(`#${id} .kb-apple canvas`) as HTMLCanvasElement,
      ios.href
    );
    QRCode.toCanvas(
      document.querySelector(`#${id} .kb-android canvas`) as HTMLCanvasElement,
      android.href
    );
    */
    ios && Helper.log('embedded iOS app store');
    android && Helper.log('embedded Android app store');
  });
}

/*
function waitForLib(paragraphs: HTMLElement[]) {
  if (QRCode === undefined) {
    setTimeout(() => waitForLib(paragraphs));
  } else {
    embed(paragraphs);
  }
}
*/

export default function AppStore() {
  Helper.onGoogleDocEmbed<HTMLParagraphElement>(
    `p:has(${appStore}), p:has(${playStore})`,
    (paragraphs) => {
      /*
      const lib = document.createElement('script') as HTMLScriptElement;
      lib.src =
        'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js';
      lib.integrity =
        'sha512-PEhlWBZBrQL7flpJPY8lXx8tIN7HWX912GzGhFTDqA3iWFrakVH3lVHomCoU9BhfKzgxfEk6EG2C3xej+9srOQ==';
      lib.crossOrigin = 'anonymous';
      lib.referrerPolicy = 'no-referrer';
      document.head.appendChild(lib);
      waitForLib(paragraphs);
      */
      embed(paragraphs);
    }
  );
}
