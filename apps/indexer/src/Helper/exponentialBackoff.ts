import crypto from 'crypto';
import File from '../Cache/File';
import errorMessage from './errorMessage';

type RetriableAction<T> = () => T | Promise<T>;

type ApiError = {
  code?: number;
  message?: string;
};

export default async function exponentialBackoff<T = any>(
  action: RetriableAction<T>,
  ignoreErrors = true,
  retries = 5,
  lastTimeout = 0
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await action());
    } catch (_e) {
      const error = _e as ApiError;
      if (error.code == 503 && retries > 0) {
        File.event.emit(File.Event.Start, `${retries} retries left`);
        const timeout = lastTimeout
          ? lastTimeout * 2
          : crypto.randomInt(50, 100);
        setTimeout(
          async () =>
            resolve(
              await exponentialBackoff<T>(
                action,
                ignoreErrors,
                retries - 1,
                timeout
              )
            ),
          timeout
        );
      } else {
        this.index.status = error.message || JSON.stringify(error);
        File.event.emit(File.Event.Fail, errorMessage(undefined, {}, error));
        if (!ignoreErrors) {
          reject(error);
        }
      }
    }
  });
}
