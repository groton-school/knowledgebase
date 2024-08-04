import Helper from '../../Helper';

export default function Directory(directory: HTMLDivElement) {
  const card = document.createElement('div');
  card.classList.add('card', 'col-md-9', 'order-md-1'); // TODO config spacing
  directory.classList.add('card-body', 'row');
  directory.parentElement?.insertBefore(card, directory);
  card.appendChild(directory);
  Array.from(directory.querySelectorAll('.page')).forEach((page) => {
    page.classList.add('card', 'mb-3'); // TODO config spacing
    (page as HTMLElement).style.maxWidth = '3.5in';

    const row = document.createElement('div');
    row.classList.add('row', 'g-0');
    page.prepend(row);
    /*
    const thumbnail = document.createElement('div');
    thumbnail.classList.add('thumbnail', 'col-md-4');
    thumbnail.innerHTML = `
      <img class="img-fluid rounded-start" src="/assets/acad-tech-icon.png" />
    `;
    row.append(thumbnail);
    */
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
      const text = document.createElement('div');
      text.classList.add('card-text', 'description');
      text.innerHTML = '<small class="text-body-secondary"></small>';
      text.firstElementChild!.append(...description.childNodes);
      body.append(text);
      description.remove();
    }

    page.querySelector('a')?.classList.add('stretched-link');
  });
  Helper.log('Updated #directory DOM');
}
