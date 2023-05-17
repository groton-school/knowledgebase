import Helper from '../../Helper';
import './styles.scss';

const PERMALINK_SELECTOR = 'gs-permalink';

export default function Permalinks() {
  Helper.onGoogleDocEmbed(
    Array.from(Array(6).keys()).reduce(
      (selector, level) => [selector, `h${level + 1}:not([id=""])`].join(','),
      '.gs-add-permalink'
    )
  ).then((headers: HTMLElement[]) => {
    if (!document.querySelector(`.${PERMALINK_SELECTOR}`)) {
      headers.forEach((h) => {
        const a = document.createElement('a');
        a.href = `#${h.id}`;
        a.innerHTML = Helper.fontAwesome('link');
        a.classList.add(PERMALINK_SELECTOR);
        h.append(a);
      });
    }
  });
}
