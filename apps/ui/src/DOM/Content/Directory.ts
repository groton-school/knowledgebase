import Helper from '../../Helper';

export default function Directory(directory: HTMLDivElement) {
  const card = document.createElement('div');
  card.classList.add('card', 'col-md-9', 'order-md-1'); // TODO config spacing
  directory.classList.add('card-body', 'row');
  directory.parentElement?.insertBefore(card, directory);
  card.appendChild(directory);
  Array.from(directory.querySelectorAll('.page')).forEach((page) => {
    page.classList.add('card', 'm-1', 'col-md-3'); // TODO config spacing
    const name = page.querySelector('.name') as HTMLDivElement;
    const h5 = document.createElement('h5');
    h5.append(...name.childNodes);
    h5.classList.add('card-title');
    page.replaceChild(h5, name);
    page.innerHTML = `<div class="card-body">${page.innerHTML}</div>`;
    page.querySelector('a')?.classList.add('stretched-link');
  });
  Helper.log('Updated #directory DOM');
}
