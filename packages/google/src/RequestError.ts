import { Coerce, isError } from '@battis/typescript-tricks';

class RequestError extends Error {
  code?: string | number; // @google-cloud/storage types/build/esm/src/file.d.ts it as a string, but empirically it's returning a number
  errors?: Error[];
  config?: {
    url?: string;
  };
}

function isRequestError(error: unknown): error is RequestError {
  return isError(error) && 'code' in error && 'errors' in error;
}

export function CoerceRequestError(u: unknown): RequestError {
  return Coerce<RequestError>(
    u,
    isRequestError,
    (e) =>
      e as RequestError /* TODO there is _probably_ a better way to do this! ;) */
  );
}
