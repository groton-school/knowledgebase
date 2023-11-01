import Helper from '../../Helper';
import './styles.scss';

export default function HideHeaderAndFooter() {
  Helper.onGoogleDocEmbed('div', (divs) => {
    divs.forEach((div) => {
      if (div.querySelector('a[id^="ftnt"]')) {
        div.classList.add('kb-ftnt');
      }
    });
    Helper.log('hide header/footer');
  });
}
