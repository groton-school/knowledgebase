import CLI from '@battis/qui-cli';
import path from 'node:path';
import valid from './validGCSFilenameCharacters.js';

const GCSPath = new RegExp(`(/?([${valid}]+/)+[${valid}]+)`, 'gi');

function fancyUrl(url: string) {
  const urlPath = path.dirname(url);
  return `${urlPath != '.' ? CLI.colors.url(`${urlPath}/`) : ''}${CLI.colors.value(path.basename(url))}`;
}

export default function colorizeStatus(status: string) {
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
    CLI.colors.value('$1')
  );
}
