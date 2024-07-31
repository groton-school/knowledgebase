import Helper from '../../../Helper';

export default function TOC(doc: HTMLDivElement) {
  doc.parentElement?.insertAdjacentHTML(
    'afterbegin',
    // TODO template
    // TODO config spacing
    `<div id="toc" class="card col-md-3 order-md-2 sticky-lg-top">
          <div class="card-body">
            <h5 class="card-title">On this page</h5>
            <div class="card-text dynamic-content"></div>
          </div>
        </div>`
  );
  Helper.log(`Added #toc DOM`);
}
