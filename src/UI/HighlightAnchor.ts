import Helper from '../Helper';
import './HighlightAnchor.scss';

const highlight = 'gs-highlight';

function scrollToHash() {
  if (window.location.hash.length) {
    const anchor = document.querySelector(
      window.location.hash.replace('.', '\\.')
    );
    if (anchor) {
      anchor.scrollIntoView();
      const clone = anchor.cloneNode(true) as HTMLElement;
      anchor.parentNode?.replaceChild(clone, anchor);
      if (clone.classList) {
        clone.classList.add(highlight);
      } else {
        clone.className = highlight;
      }
    }
  }
}

export default function HighlightAnchor() {
  addEventListener('hashchange', scrollToHash);
  Helper.waitForSelector('h1').then(scrollToHash);
}
