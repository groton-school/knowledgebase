/*
 * I _think_ this is easier than trying to hook into the existing Lightbox and differentiating between UI elements and embedded images
 */
import Helper from '../../Helper';
import './styles.scss';

function Embiggenate(e: MouseEvent) {
  const target = e.target as HTMLImageElement;

  const scrim = document.createElement('div');
  scrim.classList.add(
    window
      .getComputedStyle(document.body)
      .getPropertyValue('--ui-embiggen-embiggen'),
    window
      .getComputedStyle(document.body)
      .getPropertyValue('--ui-embiggen-scrim')
  );

  const closeBox = document.createElement('div');
  closeBox.classList.add(
    window
      .getComputedStyle(document.body)
      .getPropertyValue('--ui-embiggen-closeBox')
  );
  closeBox.innerText = '×';
  scrim.appendChild(closeBox);

  const wrapper = document.createElement('div');
  wrapper.classList.add(
    window
      .getComputedStyle(document.body)
      .getPropertyValue('--ui-embiggen-wrapper')
  );
  scrim.appendChild(wrapper);

  const image = document.createElement('div');
  image.classList.add(
    window
      .getComputedStyle(document.body)
      .getPropertyValue('--ui-embiggen-image'),
    window
      .getComputedStyle(document.body)
      .getPropertyValue('--ui-embiggen-zoomed')
  );
  image.style.backgroundImage = `url(${target.src})`;
  wrapper.appendChild(image);

  if (target.alt) {
    const caption = document.createElement('p');
    caption.classList.add(
      window
        .getComputedStyle(document.body)
        .getPropertyValue('--ui-embiggen-caption')
    );
    caption.innerText = target.alt;
    wrapper.appendChild(caption);
  }

  document.body.appendChild(scrim);
  scrim.addEventListener('click', () => Disembiggenate(scrim));
  Helper.log(`Embiggening ${target.alt || target.src}`);
}

function Disembiggenate(scrim: HTMLDivElement) {
  scrim.remove();
  Helper.log(`Disembiggening`);
}

export default function Embiggen() {
  Helper.onGoogleDocEmbed<HTMLImageElement>(
    'span:only-child > img',
    (images) => {
      images.forEach((image) => {
        image.classList.add(
          window
            .getComputedStyle(document.body)
            .getPropertyValue('--ui-embiggen-embiggen'),
          window
            .getComputedStyle(document.body)
            .getPropertyValue('--ui-embiggen-image'),
          window
            .getComputedStyle(document.body)
            .getPropertyValue('--ui-embiggen-original')
        );
        image.addEventListener('click', Embiggenate);
        Helper.log(`🖼️ ${image.alt || image.src} embiggenable`);
      });
    }
  );
}
