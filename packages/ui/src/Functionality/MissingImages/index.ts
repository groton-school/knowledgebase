import Helper from '../../Helper';
import styles from './styles.module.scss';
import './styles.scss';

export default function MissingImages() {
  Helper.onGoogleDocEmbed<HTMLImageElement>('img', (images) => {
    images.map((img) =>
      img.addEventListener('error', (...args) => {
        console.error(
          `error loading ${
            img.src
          }: ${args.toString()} (try refreshing the embedded Google Doc, force refreshing the page, or enabling 3rd party cookies)`
        );
        img.outerHTML = `<div class="${styles.missing} kb-include">This image failed to load. Try refreshing this document from the &#9776; menu.</div>`;
      })
    );
  });
}
