import cli from '@battis/qui-cli';

export function colorizeStatus(p: string) {
  return p.replace(
    /(\/?([a-z0-9._-]+\/)+([a-z0-9()._-]+))/gi,
    cli.colors.url('$1')
  ).replace(/((user|group):[a-z0-9._-]+@[a-z0-9._-]+)/gi, cli.colors.value('$1'));
}

export function errorMessage(
  message: string = undefined,
  context: object,
  error: any
) {
  return `${message ? `${message} (` : ''}${
    error
      ? `${
          typeof error == 'object'
            ? 'message' in error
              ? error.message
              : JSON.stringify(error)
            : error
        }, `
      : ''
  }${JSON.stringify(context)}${message ? ')' : ''}`;
}
