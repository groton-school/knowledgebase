import File from '../Cache/File';
import errorMessage from './errorMessage';
import crypto from 'crypto';

export default async function exponentialBackoff(
  action: Function,
  ignoreErrors = true,
  retries = 5,
  lastTimeout = 0
) {
  try {
    await action();
    return;
  } catch (_e) {
    const error = _e as { code?: number; message?: string };
    if (error.code == 503 && retries > 0) {
      File.event.emit(File.Event.Start, `${retries} retries left`);
      const timeout = lastTimeout ? lastTimeout * 2 : crypto.randomInt(50, 100);
      setTimeout(
        () => exponentialBackoff(action, ignoreErrors, retries - 1, timeout),
        timeout
      );
    } else {
      this.index.status = error.message || JSON.stringify(error);
      File.event.emit(File.Event.Fail, errorMessage(undefined, {}, error));
      if (!ignoreErrors) {
        throw error;
      }
    }
  }
}
