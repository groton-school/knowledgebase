import Helper from '../../Helper';
import './styles.scss';

export default function HideHeaderAndFooter() {
  Helper.onGoogleDocEmbed<HTMLDivElement>('div', (divs) => {
    divs.forEach((div) => {
      if (div.querySelector('a[id^="ftnt"]')) {
        div.classList.add('ui-include'); // TODO Configurable `.ui-include`
      }
    });
    Helper.log('hide header/footer');
  });
}
