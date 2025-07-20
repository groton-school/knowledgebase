import * as Helper from '../../Helper';
import './styles.scss';

export function HideHeaderAndFooter() {
  Helper.onGoogleDocEmbed<HTMLDivElement>('div', (divs) => {
    divs.forEach((div) => {
      if (div.querySelector('a[id^="ftnt"]')) {
        div.classList.add(
          window
            .getComputedStyle(document.body)
            .getPropertyValue('--ui-hideheaderandfooter-include')
        );
      }
    });
    Helper.log('hide header/footer');
  });
}
