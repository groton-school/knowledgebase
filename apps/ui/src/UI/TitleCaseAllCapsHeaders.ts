import Helper from '../Helper';

const properNouns = [
  '2FA',
  'AI',
  'AirPlay',
  'Alta Open', // opt-space to turn it into a single token
  'Anker',
  'AMX',
  'Android',
  'Adobe',
  'Apple',
  'Apple ID',
  'AppleCare',
  'April',
  'Ashburn, VA',
  'August',
  'AV',
  'A/V',
  'BB&N',
  'Canva',
  'CD',
  'Chaffee',
  'ChatGPT',
  'Chrome',
  'Creative Cloud',
  'Creative Cloud Express',
  'December',
  'Dell',
  'DLP',
  'DVD',
  'Edpuzzle',
  'Epson',
  'February',
  'Google',
  'Google Assignments',
  'Google Calendar',
  'Google Drive',
  'Google Forms',
  'Google Takeout',
  'Google Workspace',
  'GPT',
  'Groton',
  'HDMI',
  'I',
  'iCloud',
  'iOS',
  'iPad',
  'iPadOS',
  'iPhone',
  'Jamf',
  'January',
  'July',
  'June',
  'K-12',
  'K.I.S.S.',
  'Loomis',
  'macOS',
  'March',
  'MathType',
  'May',
  'MFA',
  'Microsoft',
  'Microsoft Office',
  'MIDI',
  'myGroton',
  'NBM',
  'Notability',
  'November',
  'October',
  'OneNote',
  'OpenAI',
  'Openpath',
  'PC',
  'SEO',
  'September',
  'TV',
  'USB',
  'USB-C',
  'Windows',
  'Wiris',
  'Zoom'
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
      let fixed = properNouns.reduce(
        (result, noun) => {
          if (noun.toLowerCase() === result) {
            return noun;
          }
          return result;
        },
        (word || '').toLowerCase()
      );
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
