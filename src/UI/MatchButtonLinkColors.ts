import Helper from '../Helper';

export default function MatchButtonLinkColors() {
  Helper.onSelectorReady<HTMLAnchorElement>('.od-pb-panel-body a.btn').then(
    (buttons) => {
      // create a test link to figure out what color the button _should_ be
      const a = document.createElement('a');
      document.body.appendChild(a);
      const color = window.getComputedStyle(a).getPropertyValue('color');
      a.remove();

      buttons.forEach((button) => {
        button.style.backgroundColor = color;
        Helper.log(`${button.innerText} color fixed`);
      });
    }
  );
}
