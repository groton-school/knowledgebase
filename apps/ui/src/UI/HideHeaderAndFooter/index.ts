import Helper from '../../Helper';
import './styles.scss';
import styles from './styles.scss';

export default function HideHeaderAndFooter() {
  Helper.onGoogleDocEmbed<HTMLDivElement>('div', (divs) => {
    divs.forEach((div) => {
      if (div.querySelector('a[id^="ftnt"]')) {
        div.classList.add(styles.include);
      }
    });
    Helper.log('hide header/footer');
  });
}
