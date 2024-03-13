import Helper from '../Helper';

const properNouns = [
  '2FA',
  'AI',
  'Anker',
  'AMX',
  'Android',
  'Apple',
  'April',
  'August',
  'AV',
  'A/V',
  'BB&N',
  'CD',
  'Chaffee',
  'ChatGPT',
  'Chrome',
  'December',
  'Dell',
  'DVD',
  'Epson',
  'February',
  'Google',
  'GPT',
  'Groton',
  'HDMI',
  'I',
  'iOS',
  'iPadOS',
  'January',
  'July',
  'June',
  'K-12',
  'Loomis',
  'macOS',
  'March',
  'May',
  'MFA',
  'November',
  'October',
  'OpenAI',
  'Openpath',
  'SEO',
  'September',
  'TV',
  'USB',
  'USB-C',
  'Windows'
];

// collect any non-letters in properNouns
const nonLetters = [
  ...new Set(
    properNouns
      .join('')
      .toLowerCase()
      .split('')
      .filter((letter) => !/[a-z]/.test(letter))
  )
]
  .sort()
  .join('')
  .replace('-', '\\-');

function fixCase(text: string) {
  return text
    .trim()
    .split(' ')
    .map((part, i) => {
      const [, prefix, word, suffix] =
        part
          .toLowerCase()
          .match(new RegExp(`^([^a-z]*)([${nonLetters}a-z]+)([^a-z]*)$`)) || [];
      let fixed = properNouns.reduce((result, noun) => {
        if (noun.toLowerCase() === result) {
          return noun;
        }
        return result;
      }, (word || '').toLowerCase());
      if (i == 0) {
        fixed = fixed.substring(0, 1).toUpperCase() + fixed.substring(1);
      }
      return `${prefix || ''}${fixed}${suffix || ''}`;
    })
    .join(' ');
}

export default function TitleCaseAllCapsHeaders() {
  Helper.onGoogleDocEmbed<HTMLHeadingElement>('h1, h2', (headings) => {
    headings.forEach((heading) => {
      const prev = heading.innerText;
      heading.innerText = fixCase(prev);
      Helper.log(`${prev} → ${heading.innerText}`);
    });
  });
}
