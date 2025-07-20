export function vanity(text: string) {
  const lines = text.split('\n');
  const pad = (width: number, line: string) =>
    `${line}${
      width > line.length ? new Array(width - line.length + 1).join(' ') : ''
    }`;
  console.log(
    '%c' +
      lines
        .map(pad.bind(null, Math.max(...lines.map((line) => line.length))))
        .join('%c\n%c'),
    'margin: -1px; padding: 5px 9px; color: #a6093d; background: white; border: solid 1px #a6093d',
    ...new Array(lines.length)
      .join(
        // double VANITY to insert blank styling for newlines
        'VANITYVANITYmargin: -1px; padding: 2px 10px; color: white; background: #a6093d'
      )
      .split('VANITY')
      .slice(1)
  );
}
