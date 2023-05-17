import Helper from '../../Helper';
import './styles.scss';

const appStore = 'a[href^="https://apps.apple.com/"]';
const playStore = 'a[href^="https://play.google.com/"]';

export default function AppStoreLinks() {
  Helper.onGoogleDocEmbed(`p:has(${appStore}), p:has(${playStore})`).then(
    (paragraphs) => {
      paragraphs.forEach((p) => {
        const ios = p.querySelector(appStore) as HTMLAnchorElement;
        const android = p.querySelector(playStore) as HTMLAnchorElement;
        const id = crypto.randomUUID();
        p.outerHTML =
          `<div id="${id}">` +
          `<div class="gs-app-links">` +
          (ios &&
            `<div class="gs-apple">` +
            `<a href="${ios.href}">` +
            `<img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1320192000"/>` +
            `</a>` +
            `</div>`) +
          (android &&
            `<div class="gs-play">` +
            `<a href="${android.href}">` +
            `<img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"/>` +
            `</a>` +
            `</div>`) +
          `</div>` +
          `</div>`;
      });
      Helper.log('embedded app store links');
    }
  );
}
