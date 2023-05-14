import Helper from '../Helper';
import './Permalinks.scss';

const PERMALINK_SELECTOR = 'gs-permalink';

export default function Permalinks() {
  Helper.waitForSelector(
    Array.from(Array(6).keys()).reduce(
      (selector, level) => [selector, `h${level + 1}:not([id=""])`].join(','),
      '.gs-add-permalink'
    )
  ).then((headers: HTMLElement[]) => {
    if (!document.querySelector(`.${PERMALINK_SELECTOR}`)) {
      headers.forEach((h) => {
        const a = document.createElement('a');
        a.href = `#${h.id}`;
        a.innerHTML = Helper.fa('link');
        a.classList.add(PERMALINK_SELECTOR);
        h.append(a);
      });
    }
  });
}
