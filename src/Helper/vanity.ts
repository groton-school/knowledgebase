export default function Vanity(text: string) {
  const lines = text.split('\n');
  const pad = (width: number, line: string) =>
    `${line}${
      width > line.length ? new Array(width - line.length + 1).join(' ') : ''
    }`;
  console.log(
    '%c ' +
      lines
        .map(pad.bind(null, Math.max(...lines.map((line) => line.length))))
        .join(' \n ') +
      ' ',
    'padding: 2px; color: white; background: #a6093d'
  );
}
