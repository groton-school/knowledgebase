/**
 * Log messages to console
 * @param {any} message
 */
export default function log(message: any) {
  console.log(
    typeof message == 'string' ? `🦓 ${message}` : JSON.stringify(message)
  );
}
