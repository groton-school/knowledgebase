import Helper from '../../Helper';
import Builder from './Builder';
import './styles.scss';

const TOC_TITLE = 'On this page';

/* Maximum header level to display */
const MAX_DEPTH = 3;

/**
 * Generate Google Doc-style outline as TOC
 */
export default function TOC() {
  Helper.onGoogleDocEmbed<HTMLHeadingElement>(
    [...Array(Math.min(6, Math.max(0, MAX_DEPTH))).keys()]
      .map((d) => `h${d + 1}`)
      .join(','),
    (headings) => {
      const toc = document.createElement('div');
      toc.insertAdjacentHTML(
        'afterbegin',
        `<div class="heading">${TOC_TITLE}</div>`
      );
      const builder = new Builder();
      headings.forEach((h) => {
        builder.add(
          h.innerText,
          `#${h.id}`,
          parseInt(h.tagName.substring(h.tagName.length - 1)) - 1
        );
      });
      toc.append(builder.finalize());
      document.querySelector('#toc')?.prepend(toc);
      Helper.log(`built “${TOC_TITLE}”`);
    }
  );
}
