import Helper from '../Helper';

function scrollToHash() {
  if (window.location.hash.length) {
    const anchor = document.querySelector(
      window.location.hash.replace('.', '\\.')
    ) as HTMLElement;
    if (anchor) {
      Helper.log(`scroll to ${anchor.innerText}`);
      anchor.scrollIntoView();
      window.scrollTo(0, 0);
      for (const elt of Array.from(
        document.querySelectorAll('.kb-highlight')
      )) {
        elt.classList.remove('mark', 'kb-highlight');
      }
      anchor.classList.add('mark', 'kb-highlight');
      let next;
      for (
        next = anchor.nextElementSibling as HTMLElement;
        next && semanticallyContained(anchor, next);
        next = next.nextElementSibling as HTMLElement
      ) {
        next.classList.add('mark', 'kb-highlight');
      }
    }
  }
}

const hierarchy = [
  ['H1'],
  ['H2'],
  ['H3'],
  ['H4'],
  ['H5'],
  ['H6'],
  ['P', 'TABLE', 'DIV', 'UL', 'OL', 'DL'],
  ['LI', 'DT', 'TR'],
  ['DD', 'TD'],
  ['SPAN', 'A']
];
function semanticallyContained(container: HTMLElement, element: HTMLElement) {
  let c;
  for (
    c = 0;
    c < hierarchy.length && !hierarchy[c].includes(container.tagName);
    c++
  );
  let e;
  for (
    e = 0;
    e < hierarchy.length && !hierarchy[e].includes(element.tagName);
    e++
  );
  return c < e;
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
