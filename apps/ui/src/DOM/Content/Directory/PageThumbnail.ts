import Constants from '../../../Constants';
import config from '../../../config';

export default function PageThumbnail(page: Element) {
  page.classList.add(
    'card',
    'col-md-4',
    'g-0',
    'p-0',
    Constants.bootstrap.margin
  );
  (page as HTMLElement).style.maxWidth = '3.5in';

  const row = document.createElement('div');
  row.classList.add('row', 'g-0', 'h-100');
  page.prepend(row);

  const a = page.querySelector('a');
  a?.classList.add('stretched-link');

  const thumbnail = document.createElement('div');
  thumbnail.classList.add('thumbnail', 'col-md-4', 'col-2');

  const img = document.createElement('img');
  img.style.display = 'none';
  img.src = `${config.directory.thumbnails.root}${new URL(
    a!.href
  ).pathname.replace(/\/$/, '')}.png`;
  img.addEventListener(
    'error',
    () =>
      (img.src = page.classList.contains('directory')
        ? config.directory.thumbnails.directory ||
          config.directory.thumbnails.default
        : config.directory.thumbnails.default)
  );
  img.addEventListener('load', () => {
    const canvas = document.createElement('canvas');
    canvas.classList.add('img-fluid', 'rounded-corner');
    canvas.width = img.width;
    canvas.height = img.height;
    thumbnail.appendChild(canvas);
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(img, 0, 0);

      const line = context?.getImageData(0, canvas.height - 2, canvas.width, 1);

      const colors: Record<string, number> = {};
      let rgba: string;
      for (let pixel = 0; pixel < line.data.length; pixel += 4) {
        const rgba = `rgba(${line.data[pixel]},${line.data[pixel + 1]},${
          line.data[pixel + 2]
        },${line.data[pixel + 3]})`;
        if (colors[rgba]) {
          colors[rgba]++;
        } else {
          colors[rgba] = 1;
        }
      }

      thumbnail.style.setProperty(
        '--ui-bgcolor',
        Object.keys(colors).reduce(
          (max, color) => (colors[max] > colors[color] ? max : color),
          rgba!
        )
      );
    }
  });
  thumbnail.appendChild(img);

  row.append(thumbnail);

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
