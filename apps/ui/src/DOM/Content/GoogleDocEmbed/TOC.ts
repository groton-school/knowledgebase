import * as Constants from '../../../Constants';
import * as Helper from '../../../Helper';

export function TOC(doc: HTMLDivElement) {
  doc.parentElement?.insertAdjacentHTML(
    'afterbegin',
    // TODO template
    // TODO config spacing
    `<div id="toc" class="card col-md-3 order-md-2 ${Constants.bootstrap.padding} ${Constants.bootstrap.margin} sticky-lg-top">
          <div class="card-body">
            <h5 class="card-title">On this page
              <a
                href="${
                  (
                    document.head.querySelector(
                      'meta[item-prop="kb.webViewLink"]'
                    ) as HTMLMetaElement
                  )?.content
                }"
                class="printable-view float-end"
                target="_blank"
              >
                <i class="bi bi-printer-fill"></i>
              </a>
            </h5>
            <div class="card-text">
              <div class="dynamic-content"></div>
            </div>
          </div>
        </div>`
  );
  Helper.log(`Added #toc DOM`);
}
