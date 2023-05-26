import * as Constants from '../../Constants';
import Helper from '../../Helper';
import './styles.scss';

const highlight = 'kb-highlight';

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
      Array.from(document.querySelectorAll(`.${highlight}`)).forEach((h) =>
        h.classList.remove(highlight)
      );
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
  Helper.onGoogleDocEmbed('h1, h2, h3, h4, h5, h6', scrollToHash);
}
