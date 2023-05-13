import Helper from '../Helper';
import * as OverDrive from '../OverDrive';
import './TOC.scss';

export default function TOC() {
  Helper.waitForSelector('h1, h2, h3' /*, h4, h5, h6'*/).then((headings) => {
    const panel = OverDrive.Panel.panel();
    panel.append(OverDrive.Panel.heading('On this page', '#'));
    const builder = new OverDrive.SubNav.Builder('gs-toc');
    headings.forEach((h) => {
      builder.add(h.innerText, `#${h.id}`, parseInt(h.tagName.substr(-1)) - 1);
    });
    panel.append(builder.finalize());
    document.querySelector('#od-col-subnav')?.prepend(panel);
    const subnav = document.querySelector('#od-subnav-heading');
    subnav!.innerHTML = 'Topics'; // TODO is it possible set subnav title properly?
    Helper.log('TOC built');

    // FIXME update TOC if scrolling through folder
  });
}
