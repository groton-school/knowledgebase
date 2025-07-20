/**
 * Log messages to console
 *
 * @param {any} message
 */
export function log(message: any) {
  console.log(
    typeof message == 'string' ? `🦓 ${message}` : JSON.stringify(message)
  );
}
