import Helper from '../../Helper';
import './styles.scss';

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
      const highlight = window
        .getComputedStyle(document.body)
        .getPropertyValue('--ui-highlightanchor-highlight');
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
