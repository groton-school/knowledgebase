import Helper from '../Helper';
import * as OverDrive from '../OverDrive';
import './TOC.scss';

const TOC_SELECTOR = 'gs-toc';
const WRAPPER_SELECTOR = `${TOC_SELECTOR}-wrapper`;
const TOC_HEADING = 'On this page';
const SUBNAV_HEADING = 'Topics';

export default function TOC() {
  Helper.waitForSelector('h1, h2, h3' /*, h4, h5, h6'*/).then((headings) => {
    const panel = OverDrive.Panel.panel(WRAPPER_SELECTOR);
    panel.append(OverDrive.Panel.heading(TOC_HEADING));
    const builder = new OverDrive.SubNav.Builder(TOC_SELECTOR);
    headings.forEach((h) => {
      builder.add(h.innerText, `#${h.id}`, parseInt(h.tagName.substr(-1)) - 1);
    });
    panel.append(builder.finalize());
    const oldTOC = document.querySelector(
      `#${WRAPPER_SELECTOR}`
    ) as HTMLDivElement;
    if (oldTOC) {
      oldTOC.replaceWith(panel);
    } else {
      document.querySelector('#od-col-subnav')?.prepend(panel);
    }
    const subnav = document.querySelector('#od-subnav-heading');
    subnav && (subnav.innerHTML = SUBNAV_HEADING); // TODO is it possible set subnav title properly?
    Helper.log('TOC built');
  });
}
