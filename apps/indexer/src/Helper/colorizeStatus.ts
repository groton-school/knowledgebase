import valid from './validGCSFilenameCharacters';
import cli from '@battis/qui-cli';

const GCSPath = new RegExp(`(\/?([${valid}]+\/)+[${valid}]+)`, 'gi');

export default function colorizeStatus(status: string) {
  return status
    .replace(GCSPath, cli.colors.url('$1'))
    .replace(
      /((user|group):[a-z0-9._-]+@[a-z0-9._-]+)/gi,
      cli.colors.value('$1')
    );
}
