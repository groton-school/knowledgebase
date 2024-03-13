import Helper from '../Helper';

const properNouns = [
  '2FA',
  'AI',
  'Anker',
  'AMX',
  'Android',
  'Apple',
  'AV',
  'A/V',
  'BB&N',
  'CD',
  'Chaffee',
  'ChatGPT',
  'Chrome',
  'Dell',
  'DVD',
  'Epson',
  'Google',
  'GPT',
  'Groton',
  'HDMI',
  'I',
  'iOS',
  'iPadOS',
  'K-12',
  'Loomis',
  'macOS',
  'MFA',
  'OpenAI',
  'Openpath',
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
  Helper.onGoogleDocEmbed<HTMLHeadingElement>('h1, h2', (headings) => {
    headings.forEach((heading) => {
      const prev = heading.innerText;
      heading.innerText = fixCase(prev);
      Helper.log(`${prev} → ${heading.innerText}`);
    });
  });
}
