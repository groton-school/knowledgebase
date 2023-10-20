import Helper from '../Helper';
const titleCase = require('to-title-case');

export default function TitleCaseAllCapsHeaders() {
  Helper.onGoogleDocEmbed('h1, h2', (headings) => {
    headings.forEach((heading) => {
      if (/^[^a-z]+$/.test(heading.innerText)) {
        heading.innerText = titleCase(heading.innerText);
      }
    });
  });
}
