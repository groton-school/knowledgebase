import Helper from '../../../Helper';
import './styles.scss';

export default function Directory(directory: HTMLDivElement) {
  Array.from(directory.querySelectorAll('a')).forEach(
    (a: HTMLAnchorElement) => {
      a.classList.add('card', 'm-1'); // TODO config spacing
      const name = a.querySelector('.name') as HTMLDivElement;
      const h5 = document.createElement('h5');
      h5.innerText = name?.innerText;
      h5.classList.add('card-title');
      a.replaceChild(h5, name);
      a.innerHTML = `<div class="card-body">${a.innerHTML}</div>`;
    }
  );
  Helper.log('Updated #directory DOM');
}
