import Constants from '../../../Constants';
import Helper from '../../../Helper';
import './styles.scss';

export default function GoogleDocEmbed(doc: HTMLDivElement) {
  console.log({ parent: doc.parentElement });
  doc.parentElement?.insertAdjacentHTML(
    'afterbegin',
    // TODO template
    `<div class="col-md-4 card sticky-top m-1 p-3"><div id="toc" class="card-body"></div></div>` // TODO config spacing
  );
  doc.removeAttribute('style');
  Helper.log(`Updated ${Constants.styles.googleDocEmbed} DOM`);
}
