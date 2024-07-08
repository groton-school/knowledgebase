import Helper from '../../../Helper';
import './styles.scss';

export default function Directory(directory: HTMLDivElement) {
  const card = document.createElement('div');
  card.classList.add('col-md-7', 'card', 'm-1'); // TODO config spacing
  directory.classList.add('card-body');
  directory.parentElement?.insertBefore(card, directory);
  card.appendChild(directory);
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
