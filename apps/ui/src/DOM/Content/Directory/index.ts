import Helper from '../../../Helper';
import './styles.scss';

export default function Directory(directory: HTMLDivElement) {
  const card = document.createElement('div');
  card.classList.add('card', 'col-md-9', 'order-md-1'); // TODO config spacing
  directory.classList.add('card-body', 'row');
  directory.parentElement?.insertBefore(card, directory);
  card.appendChild(directory);
  Array.from(directory.querySelectorAll('.page')).forEach((page) => {
    page.classList.add('card', 'col-md-4');
    (page as HTMLElement).style.maxWidth = '3.5in';

    const row = document.createElement('div');
    row.classList.add('row', 'g-0');
    page.prepend(row);

    const a = page.querySelector('a');
    a?.classList.add('stretched-link');

    const thumbnail = document.createElement('div');
    thumbnail.classList.add('thumbnail', 'col-md-4');
    // FIXME use config.json
    thumbnail.innerHTML = `
      <img class="img-fluid rounded-start" onerror="this.setAttribute('data-broken','true')" src="${'/static/thumbnail'}${new URL(
      a!.href
    ).pathname.replace(/\/$/, '')}.png" />
    `;
    row.append(thumbnail);

    let body = document.createElement('div');
    body.classList.add('col-md-8');
    row.append(body);
    body.innerHTML = '<div class="card-body"></div>';
    body = body.firstElementChild as HTMLDivElement;

    const name = page.querySelector('.name') as HTMLDivElement;
    const title = document.createElement('h5');
    title.append(...name.childNodes);
    title.classList.add('card-title', 'name');
    body.append(title);
    name.remove();

    const description = page.querySelector('.description');
    if (description) {
      const text = document.createElement('p');
      text.classList.add('card-text', 'description');
      text.innerHTML = '<small class="text-body-secondary"></small>';
      text.firstElementChild!.append(...description.childNodes);
      body.append(text);
      description.remove();
    }
  });
  Helper.log('Updated #directory DOM');
}
