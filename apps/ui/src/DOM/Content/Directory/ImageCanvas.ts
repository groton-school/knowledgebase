import config from '../../../config';
import styles from './styles.module.scss';

export default function ImageCanvas({
  href,
  parent,
  where = 'afterbegin',
  propertyParent,
  isDirectory = false
}: {
  href: string;
  parent: HTMLElement;
  where?: InsertPosition;
  propertyParent?: HTMLElement;
  isDirectory?: boolean;
}) {
  const img = document.createElement('img');
  img.src = `${config.directory.thumbnails.root}${new URL(
    href
  ).pathname.replace(/\/$/, '')}.png`;
  img.classList.add(
    styles.thumbnailImage,
    'img-fluid',
    'rounded-corner',
    'align-middle'
  );
  if (parent.classList.contains('title')) {
    img.classList.add('me-3');
  }

  img.addEventListener(
    'error',
    () =>
      (img.src = isDirectory
        ? config.directory.thumbnails.directory ||
          config.directory.thumbnails.default
        : config.directory.thumbnails.default)
  );

  img.addEventListener('load', () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(img, 0, 0);

      const line = context?.getImageData(0, canvas.height - 1, canvas.width, 1);

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

      const bgColor = Object.keys(colors).reduce(
        (max, color) => (colors[max] > colors[color] ? max : color),
        rgba!
      );
      if (bgColor != 'rgba(0,0,0,0)') {
        propertyParent = propertyParent || parent;
        propertyParent.style.setProperty(styles.bgcolor, bgColor);
      }
    }
  });

  parent.insertAdjacentElement(where, img);
}
