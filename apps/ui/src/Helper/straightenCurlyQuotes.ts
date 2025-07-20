export function straightenCurlyQuotes(text: string) {
  return text.replace(/["'“”‘’]/g, '"');
}
