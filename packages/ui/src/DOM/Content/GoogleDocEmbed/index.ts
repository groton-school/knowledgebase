import Constants from '../../../Constants';
import Helper from '../../../Helper';
import './styles.scss';

export default function GoogleDocEmbed(doc: HTMLDivElement) {
  const card = document.createElement('div');
  card.classList.add('col-md-7', 'card', 'm-1'); // TODO config spacing
  doc.parentElement?.insertAdjacentHTML(
    'afterbegin',
    // TODO template
    `<div class="col-md-4 card sticky-top m-1 p-3"><div id="toc" class="card-body"></div></div>` // TODO config spacing
  );
  doc.removeAttribute('style');
  doc.classList.add('card-body');
  doc.parentElement?.insertBefore(card, doc);
  card.appendChild(doc);
  Helper.log(`Updated ${Constants.styles.googleDocEmbed} DOM`);
}
