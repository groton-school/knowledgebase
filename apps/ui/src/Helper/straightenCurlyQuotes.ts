export default function straightenCurlyQuotes(text: string) {
  return text.replace(/["'“”‘’]/g, '"');
}
