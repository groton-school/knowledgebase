import * as Constants from '../../Constants';
import Helper from '../../Helper';
import logo from './logo.png';
import './styles.scss';

export default function PageStructure() {
  document.head.insertAdjacentHTML(
    'afterbegin',
    `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${document.querySelector('.title')?.textContent}</title>
    `
  );
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div id="nav"><img src="${logo}"/></div>`
  );
  let content = document.createElement('div');
  content.setAttribute('id', 'content');
  const doc = document.querySelector(
    Constants.styles.googleDocEmbed
  ) as HTMLDivElement;
  if (doc) {
    content = doc.parentElement?.insertBefore(content, doc)!;
    content.insertAdjacentHTML('afterbegin', `<div id="toc"></div>`);
    content.appendChild(doc);
    doc.style.maxHeight = `calc(100% - ${doc.style.paddingTop} - ${doc.style.paddingBottom} - var(--spacing)`;
  } else {
    document.body.appendChild(content);
  }
  Helper.log(`Added navbar and TOC`);
}
