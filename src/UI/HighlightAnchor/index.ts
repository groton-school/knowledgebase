import * as Constants from '../../Constants';
import Helper from '../../Helper';
import styles from './styles.module.scss';
import './styles.scss';

function scrollToHash() {
  if (window.location.hash.length) {
    const anchor = document.querySelector(
      window.location.hash.replace('.', '\\.')
    );
    if (anchor) {
      anchor.scrollIntoView();
      if (window.innerWidth <= Constants.mobileWidth) {
        window.scrollBy(
          0,
          -1 * (document.querySelector('#od-navbar')?.clientHeight || 0)
        );
      }
      const clone = anchor.cloneNode(true) as HTMLElement;
      anchor.parentNode?.replaceChild(clone, anchor);
      Array.from(document.querySelectorAll(`.${styles.highlight}`)).forEach(
        (h) => h.classList.remove(styles.highlight)
      );
      if (clone.classList) {
        clone.classList.add(styles.highlight);
      } else {
        clone.className = styles.highlight;
      }
    }
  }
}

export default function HighlightAnchor() {
  addEventListener('hashchange', scrollToHash);
  Helper.onGoogleDocEmbed('h1, h2, h3, h4, h5, h6', scrollToHash);
}
