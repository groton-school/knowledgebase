import { Colors } from '@battis/qui-cli.colors';
import path from 'node:path';
import { validGCSFilenameCharacters } from './validGCSFilenameCharacters.js';

const GCSPath = new RegExp(
  `(/?([${validGCSFilenameCharacters}]+/)+[${validGCSFilenameCharacters}]+)`,
  'gi'
);

function fancyUrl(url: string) {
  const urlPath = path.dirname(url);
  return `${urlPath != '.' ? Colors.url(`${urlPath}/`) : ''}${Colors.value(path.basename(url))}`;
}

export function colorizeStatus(status: string) {
  const [, pre = '', url] = status.match(/^(Indexing )(.+)$/) || [];
  if (url) {
    status = `${pre}${fancyUrl(url)}`;
  } else {
    const [url] = status.match(GCSPath) || [];
    if (url) {
      status = status.replace(url, `${fancyUrl(url)}`);
    }
  }

  return status.replace(
    /((user|group):[a-z0-9._-]+@[a-z0-9._-]+)/gi,
    Colors.value('$1')
  );
}
