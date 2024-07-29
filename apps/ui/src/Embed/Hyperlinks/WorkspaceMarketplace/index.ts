//import * as QRCode from 'qrcode';
import Helper from '../../../Helper';
import styles from './styles.module.scss';
import './styles.scss';
import icon from './workspace.png';

const chromeWebStore = 'a[href^="https://workspace.google.com/marketplace/"]';

export default function WorkspaceMarketplace() {
  Helper.onGoogleDocEmbed<HTMLParagraphElement>(
    `p:has(${chromeWebStore})`,
    (paragraphs) => {
      paragraphs.forEach((p) => {
        const link = p.querySelector(chromeWebStore) as HTMLAnchorElement;
        const url = link.href;
        const text = link.innerText;
        p.innerHTML = `
          <form action="${url}" method="get" target="_blank">
            <button class="${styles.marketplace}" type="submit">
              ${text} in the Workspace Marketplace
            </button>
          </form>
       `;
        Helper.log(`Embedded link to ${text} in Google Workspace Marketplace`);
      });
    }
  );
}
