import Helper from '../Helper';

const properNouns = [
  'Anker',
  'Android',
  'Apple',
  'CD',
  'Chrome',
  'Dell',
  'DVD',
  'Google',
  'HDMI',
  'I',
  'iOS',
  'iPadOS',
  'Epson',
  'macOS',
  'SEO',
  'TV',
  'USB',
  'USB-C',
  'Windows'
];

function fixCase(text: string) {
  return text
    .trim()
    .split(' ')
    .map((word, i) => {
      if (/^[^a-z]+$/.test(word)) {
        word = properNouns.reduce((w, noun) => {
          if (noun.toLowerCase() === w) {
            return noun;
          }
          return w;
        }, word.toLowerCase());

        if (i == 0) {
          return word.substring(0, 1).toUpperCase() + word.substring(1);
        }
      }
      return word;
    })
    .join(' ');
}

export default function TitleCaseAllCapsHeaders() {
  Helper.onGoogleDocEmbed('h1, h2', (headings) => {
    headings.forEach((heading) => {
      const prev = heading.innerText;
      heading.innerText = fixCase(prev);
      Helper.log(`${prev} → ${heading.innerText}`);
    });
  });
}
