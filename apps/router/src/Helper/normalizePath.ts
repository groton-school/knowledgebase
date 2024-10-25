export function normalizePath(requestPath: string) {
  if (requestPath.endsWith('/')) {
    requestPath = `${requestPath}index.html`;
  }
  return requestPath.substring(1);
}
