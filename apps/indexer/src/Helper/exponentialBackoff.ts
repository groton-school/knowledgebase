import Google from '@groton/knowledgebase.google/src/index.js';
import crypto from 'crypto';
import File from '../Cache/File.js';
import errorMessage from './errorMessage.js';

type RetriableAction<T> = () => T | Promise<T>;

export default async function exponentialBackoff<T = any>(
  action: RetriableAction<T>,
  ignoreErrors = true,
  retries = 5,
  lastTimeout = 0
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await action());
    } catch (e) {
      const error = Google.CoerceRequestError(e);
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
        File.event.emit(
          File.Event.Fail,
          errorMessage('could not retry', action, e)
        );
        if (!ignoreErrors) {
          reject(error);
        }
      }
    }
  });
}
