import Helper from '../Helper';
import { HTMLFormElements } from '@battis/typescript-tricks';
import API from '@groton/knowledgebase.api';

export default function Search() {
  const search = document.querySelector('#search') as HTMLFormElement;
  const query = (search.elements as HTMLFormElements<'query'>)['query'];
  const results = document.querySelector(
    '#search-results .dynamic-content'
  ) as HTMLElement;
  search.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const response = (await (
      await fetch(`${API.Search.path}?q=${encodeURIComponent(query.value)}`)
    ).json()) as {
      name: string;
      href: string;
      description?: string;
      score: number;
    }[]; // TODO common type definition
    Helper.log(`${response.length} results for '${query.value}'`);
    if (response.length) {
      results.innerHTML = '';
      response.forEach((result) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `<div class="card-body"><div class="card-title" data-score="${
          result.score
        }"><a href="${result.href}" class="stretched-link">${
          result.name
        }</a></div>${
          result.description
            ? `<div class="card-body"><small class="card-text">${result.description}</small></div>`
            : ''
        }</div>`;
        results.appendChild(div);
      });
    } else {
      results.innerHTML = '<li>No results</li>';
    }
  });
  Helper.log('Search enabled');
}
