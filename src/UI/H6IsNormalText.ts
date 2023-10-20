import Helper from '../Helper';

export default function H6IsNormalText() {
  Helper.onGoogleDocEmbed('h6', (headings) => {
    headings.forEach((heading) => {
      heading.classList.add('od-theme-noinherit-h6-font-size');
    });
    Helper.log('h6 is normal text');
  });
}
