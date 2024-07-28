import cli from '@battis/qui-cli';
import path from 'path';

export function colorizePath(p: string) {
  return (
    cli.colors.url(path.dirname(p) + '/') + cli.colors.value(path.basename(p))
  );
}
