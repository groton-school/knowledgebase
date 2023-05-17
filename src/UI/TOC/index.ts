import Helper from '../../Helper';
import * as OverDrive from '../../OverDrive';
import './styles.scss';

const TOC_ID = 'gs-toc';
const WRAPPER_ID = `${TOC_ID}-wrapper`;
const TOC_HEADING = 'On this page';
const SUBNAV_HEADING = 'Topics';

const removeTOC = () => document.querySelector(`#${WRAPPER_ID}`)?.remove();

export default function TOC() {
  Helper.onGoogleDocEmbed('h1, h2, h3' /*, h4, h5, h6'*/).then((headings) => {
    if (headings.length === 0) {
      removeTOC();
    } else {
      const panel = OverDrive.Panel.panel(WRAPPER_ID);
      panel.append(OverDrive.Panel.heading(TOC_HEADING));
      const builder = new OverDrive.SubNav.Builder(TOC_ID);
      headings.forEach((h) => {
        builder.add(
          h.innerText,
          `#${h.id}`,
          parseInt(h.tagName.substr(-1)) - 1
        );
      });
      panel.append(builder.finalize());
      const oldTOC = document.querySelector(`#${WRAPPER_ID}`) as HTMLDivElement;
      if (oldTOC) {
        oldTOC.replaceWith(panel);
      } else {
        document.querySelector('#od-col-subnav')?.prepend(panel);
      }
      const subnav = document.querySelector('#od-subnav-heading');
      subnav && (subnav.innerHTML = SUBNAV_HEADING); // TODO is it possible set subnav title properly?
      Helper.log('TOC built');
    }
  }, removeTOC);
}
