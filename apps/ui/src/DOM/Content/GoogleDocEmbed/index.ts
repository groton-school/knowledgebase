import * as Constants from '../../../Constants';
import * as Helper from '../../../Helper';
import { TOC } from './TOC';
import './styles.scss';

export function GoogleDocEmbed(doc: HTMLDivElement) {
  TOC(doc);
  const card = document.createElement('div');
  card.classList.add(
    'card',
    'col-md-6',
    'order-1',
    Constants.bootstrap.padding,
    'pb-5',
    Constants.bootstrap.margin
  ); // TODO config spacing
  doc.removeAttribute('style');
  doc.classList.add('card-body');
  doc.parentElement?.insertBefore(card, doc);
  card.appendChild(doc);
  Helper.log(`Updated ${Constants.styles.googleDocEmbed} DOM`);
}
