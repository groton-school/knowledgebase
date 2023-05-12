import Helper from '../Helper';
import './TOC.scss';

export default function TOC() {
  Helper.waitForSelector('h1, h2, h3' /*, h4, h5, h6'*/).then((headings) => {
    const toc = document.createElement('div');
    toc.id = 'gs-toc';
    headings.forEach((h) => {
      const hElt = document.createElement('div');
      hElt.innerHTML = `<a href="#${h.id}">${h.innerText}</a>`;
      hElt.classList.add(`gs-${h.tagName.toLowerCase()}`);
      toc.append(hElt);
    });
    document.querySelector('#od-col-subnav')?.prepend(toc);
  });
}
