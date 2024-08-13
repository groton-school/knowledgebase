import PageThumbnail from '../DOM/Content/Directory/PageThumbnail';
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
    const response = await (
      await fetch(`${API.Search.path}?q=${encodeURIComponent(query.value)}`)
    ).text();
    const title = response.match(/<h1[^>]*>(.*)<\/h1>/);
    document.querySelector('#search-results .card-title')!.innerHTML =
      title && title.length > 1 ? title[1] : 'Search Results';
    const body = response.match(/<body[^>]*>((.|\n)*)<\/body>/);
    results.innerHTML =
      body && body.length > 1 ? body[1] : `<p>No results.</p>`;
    Array.from(results.querySelectorAll('.page')).forEach(PageThumbnail);
  });
  Helper.log('Search enabled');
}
