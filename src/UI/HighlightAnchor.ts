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
      if (window.innerWidth <= 576) {
        window.scrollBy(
          0,
          -1 * (document.querySelector('#od-navbar')?.clientHeight || 0)
        );
      }
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
  Helper.onGoogleDocEmbed('h1').then(scrollToHash);
}
