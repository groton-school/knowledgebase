import Helper from '../../Helper';
import styles from './styles.module.scss';
import './styles.scss';

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
