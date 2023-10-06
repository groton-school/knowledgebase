import Helper from '../../Helper';
import styles from './styles.module.scss';
import './styles.scss';

function scrollToHash(e: any) {
  if (window.location.hash.length) {
    console.log(`hashchange: ${window.location.hash}`);
    const anchor = document.querySelector(
      window.location.hash.replace('.', '\\.')
    );
    if (anchor) {
      anchor.scrollIntoView();
      window.scrollTo(0, 0);
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

/**
 * Scroll to anchor element in embedded Google Doc when loaded
 */
export default function HighlightAnchor() {
  addEventListener('hashchange', scrollToHash);
  Helper.onGoogleDocEmbed('h1, h2, h3, h4, h5, h6', scrollToHash);
}
