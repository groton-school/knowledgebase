// TODO deal with cookie expiration

const SEPARATOR = ';';

export const exists = (name: string) =>
  document.cookie.split(SEPARATOR).some((c) => new RegExp(`^${name}=`).test(c));

/**
 * Set cookie value
 * @param {string} name
 * @param {string} value
 * @param {(string|Date|number)} expiration Expiration date/time as text or Date object, or as a number of minutes from now
 */
export function set(
  name: string,
  value: string,
  expiration?: string | Date | number
) {
  if (!expiration) {
    expiration = new Date();
    expiration.setFullYear(expiration.getFullYear() + 1000);
  } else if (typeof expiration === 'number') {
    expiration = new Date(new Date().getTime() + expiration * 60000);
  } else {
    expiration = new Date(expiration);
  }
  document.cookie = `${name}=${value}; expires=${expiration.toUTCString()}`;
}

export function get(name: string) {
  const pattern = new RegExp(`^${name}=(.*)`);
  return document.cookie
    .split(SEPARATOR)
    .reduce((match: string | null, cookie) => {
      const matches = cookie.match(pattern);
      if (matches) {
        return matches[1];
      } else {
        return match;
      }
    }, null);
}

export const clear = (name: string) =>
  (document.cookie = `${name}=; expires=${new Date(
    '1970-01-01'
  ).toUTCString()}`);
