import { Colors } from '@battis/qui-cli.colors';

export function errorMessage(
  message: string | undefined = undefined,
  context: object,
  error: unknown
) {
  return `${message ? `${message} (` : ''}${Colors.error(
    error
      ? `${Colors.error(
          typeof error == 'object'
            ? 'message' in error
              ? error.message
              : JSON.stringify(error)
            : error
        )}, `
      : ''
  )}${JSON.stringify(context)}${message ? ')' : ''}`;
}
