import * as Helper from '../../Helper';
import { Builder } from './Builder';
import './styles.scss';

/* Maximum header level to display */
const MAX_DEPTH = 3; // TODO config

/** Generate Google Doc-style outline as TOC */
export function TOC() {
  Helper.onGoogleDocEmbed<HTMLHeadingElement>(
    [...Array(Math.min(6, Math.max(0, MAX_DEPTH))).keys()]
      .map((d) => `h${d + 1}`)
      .join(','),
    (headings) => {
      const dyn = document.querySelector(
        '#toc .dynamic-content'
      ) as HTMLDivElement;
      if (dyn) {
        const builder = new Builder();
        headings.forEach((h) => {
          builder.add(
            h.innerText,
            `#${h.id}`,
            parseInt(h.tagName.substring(h.tagName.length - 1)) - 1
          );
        });
        const list = builder.finalize().firstElementChild;
        list!.classList.add('dynamic-content');
        dyn.parentElement!.replaceChild(list!, dyn);
        Helper.log(`built TOC`);
      }
    }
  );
}
