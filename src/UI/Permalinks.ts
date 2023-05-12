import Helper from '../Helper';
import './Permalinks.scss';

export default function Permalinks() {
  Helper.waitForSelector(
    'h1:not([id=""]), h2:not([id=""]), h3:not([id=""]), h4:not([id=""]), h5:not([id=""]), h6:not([id=""])'
  ).then((headers: HTMLElement[]) => {
    headers.forEach((h) => {
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.innerHTML = '<i class="fas fa-link"></i>';
      a.classList.add('gs-permalink');
      h.append(a);
    });

    if (window.location.hash.length) {
      const anchor = document.querySelector(
        window.location.hash.replace('.', '\\.')
      );
      anchor?.scrollIntoView();
      anchor?.classList.add('gs-selected');
    }
  });
}
