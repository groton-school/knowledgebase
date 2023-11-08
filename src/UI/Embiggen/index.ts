/*
 * I _think_ this is easier than trying to hook into the existing Lightbox and differentiating between UI elements and embedded images
 */
import Helper from '../../Helper';
import './styles.scss';
import styles from './styles.module.scss';

function Embiggenate(e: MouseEvent) {
  const scrim = document.createElement('div');
  scrim.classList.add(styles.embiggen, styles.scrim);
  const closeBox = document.createElement('div');
  closeBox.classList.add(styles.closeBox);
  closeBox.innerText = '×';
  const image = document.createElement('div');
  image.classList.add(styles.image, styles.zoomed);
  image.style.backgroundImage = `url(${(e.target as HTMLImageElement).src})`;

  scrim.appendChild(closeBox);
  scrim.appendChild(image);
  document.body.appendChild(scrim);
  scrim.addEventListener('click', () => Disembiggenate(scrim));
  Helper.log(`Embiggening ${(e.target as HTMLImageElement).src}`);
}

function Disembiggenate(scrim: HTMLDivElement) {
  scrim.remove();
  Helper.log(`Disembiggening`);
}

export default function Embiggen() {
  Helper.onGoogleDocEmbed(
    'span:only-child > img',
    (images: HTMLImageElement[]) => {
      images.forEach((image) => {
        image.classList.add(styles.embiggen, styles.image, styles.original);
        image.addEventListener('click', Embiggenate);
        Helper.log(`${image.src} embiggenable`);
      });
    }
  );
}
