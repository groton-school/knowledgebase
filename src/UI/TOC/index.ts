import Helper from '../../Helper';
import * as OverDrive from '../../OverDrive';
import styles from './styles.module.scss';
import './styles.scss';

const TOC_TITLE = 'On this page';
const MAX_DEPTH = 3;

const removeTOC = () => document.querySelector(`#${styles.wrapper}`)?.remove();

export default function TOC() {
  Helper.onGoogleDocEmbed(
    [...Array(Math.min(6, Math.max(0, MAX_DEPTH))).keys()]
      .map((d) => `h${d + 1}`)
      .join(','),
    (headings) => {
      if (headings.length === 0) {
        removeTOC();
      } else {
        const panel = OverDrive.Panel.panel(styles.wrapper);
        panel.append(OverDrive.Panel.heading(TOC_TITLE));
        const builder = new OverDrive.SubNav.Builder(styles.toc);
        headings.forEach((h) => {
          builder.add(
            h.innerText,
            `#${h.id}`,
            parseInt(h.tagName.substr(-1)) - 1
          );
        });
        panel.append(builder.finalize());
        const oldTOC = document.querySelector(
          `#${styles.wrapper}`
        ) as HTMLDivElement;
        if (oldTOC) {
          oldTOC.replaceWith(panel);
        } else {
          document.querySelector('#od-col-subnav')?.prepend(panel);
        }
        Helper.log('TOC built');
      }
    }
  );
  document.body.addEventListener(Helper.onLoad.GoogleDocRemoveEvent, removeTOC);
}
