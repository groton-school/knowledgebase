import Helper from '../../Helper';
import './styles.scss';
import styles from './styles.scss';

function scrollToHash() {
  if (window.location.hash.length) {
    const anchor = document.querySelector(
      window.location.hash.replace('.', '\\.')
    ) as HTMLElement;
    if (anchor) {
      Helper.log(`scroll to ${anchor.innerText}`);
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
  Helper.onGoogleDocEmbed<HTMLHeadingElement>(
    'h1, h2, h3, h4, h5, h6',
    scrollToHash
  );
}
