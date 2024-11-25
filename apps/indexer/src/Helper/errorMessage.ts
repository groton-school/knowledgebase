import cli from '@battis/qui-cli';

export default function errorMessage(
  message: string | undefined = undefined,
  context: object,
  error: any
) {
  return `${message ? `${message} (` : ''}${cli.colors.error(
    error
      ? `${cli.colors.error(
          typeof error == 'object'
            ? 'message' in error
              ? error.message
              : JSON.stringify(error)
            : error
        )}, `
      : ''
  )}${JSON.stringify(context)}${message ? ')' : ''}`;
}
