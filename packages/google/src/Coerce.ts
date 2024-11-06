import { Coerce, isError } from '@battis/typescript-tricks';
import { File } from '@google-cloud/storage';

class RequestError extends Error {
  code?: string | number; // @google-cloud/storage types/build/esm/src/file.d.ts it as a string, but empirically it's returning a number
  errors?: Error[];
}

function isRequestError(error: unknown): error is RequestError {
  return isError(error);
}

export function CoerceRequestError(u: unknown): RequestError {
  return Coerce<RequestError>(u, isRequestError);
}
