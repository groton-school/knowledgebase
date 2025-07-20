import * as Helper from '../Helper';

export function H6IsNormalText() {
  Helper.onGoogleDocEmbed<HTMLHeadingElement>('h6', (headings) => {
    headings.forEach((heading) => {
      heading.classList.add('od-theme-noinherit-h6-font-size');
    });
    Helper.log('h6 is normal text');
  });
}
