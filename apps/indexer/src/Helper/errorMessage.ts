import CLI from '@battis/qui-cli';

export default function errorMessage(
  message: string | undefined = undefined,
  context: object,
  error: unknown
) {
  return `${message ? `${message} (` : ''}${CLI.colors.error(
    error
      ? `${CLI.colors.error(
          typeof error == 'object'
            ? 'message' in error
              ? error.message
              : JSON.stringify(error)
            : error
        )}, `
      : ''
  )}${JSON.stringify(context)}${message ? ')' : ''}`;
}
