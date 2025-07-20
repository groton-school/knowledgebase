import * as Helper from '../Helper';

export function LockImageWidth() {
  Helper.onGoogleDocEmbed<HTMLSpanElement>(
    'span[style*="width"]:only-child',
    (spans) => {
      spans.forEach((span) => {
        span.style.width = '';
        span.style.height = '';
        Array.from(span.querySelectorAll('img')).forEach((img) => {
          img.style.maxWidth = '100%';
          img.style.height = '';
        });
      });
    }
  );
}
