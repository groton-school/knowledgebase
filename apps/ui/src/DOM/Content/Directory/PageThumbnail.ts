import Constants from '../../../Constants';
import ImageCanvas from './ImageCanvas';
import styles from './styles.module.scss';

export default function PageThumbnail(page: HTMLElement) {
  page.classList.add(
    'card',
    'col-md-4',
    'g-0',
    'p-0',
    Constants.bootstrap.margin
  );
  page.style.maxWidth = '3.5in';

  const row = document.createElement('div');
  row.classList.add('row', 'g-0', 'h-100');
  page.prepend(row);

  const a = page.querySelector('a');
  a?.classList.add('stretched-link');

  const thumbnail = document.createElement('div');
  thumbnail.classList.add(
    styles.thumbnail,
    'col-md-4',
    'col-2',
    'rounded-start'
  );

  if (a && page) {
    ImageCanvas({
      href: a.href,
      parent: thumbnail,
      isDirectory: page.classList.contains('directory')
    });
    row.append(thumbnail);
  }
  let body = document.createElement('div');
  body.classList.add('col-md-8', 'col-10');
  row.append(body);
  body.innerHTML = '<div class="card-body p-2"></div>';
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
}
