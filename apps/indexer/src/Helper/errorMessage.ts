export default function errorMessage(
  message: string | undefined = undefined,
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
