import Helper from '../../Helper';
import './styles.scss';

const PERMALINK_SELECTOR = 'kb-permalink';

export default function Permalinks() {
  Helper.onGoogleDocEmbed(
    Array.from(Array(6).keys()).reduce(
      (selector, level) => [selector, `h${level + 1}:not([id=""])`].join(','),
      '.kb-add-permalink'
    ),
    (headers: HTMLElement[]) => {
      if (!document.querySelector(`.${PERMALINK_SELECTOR}`)) {
        headers.forEach((h) => {
          const a = document.createElement('a');
          a.href = `#${h.id}`;
          a.innerHTML = `<i class="fas fa-link"></i>`;
          a.classList.add(PERMALINK_SELECTOR);
          h.append(a);
        });
      }
    }
  );
}
