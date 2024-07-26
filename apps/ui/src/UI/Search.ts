import Helper from '../Helper';

export default function Search() {
  const search = document.querySelector('#search') as HTMLFormElement;
  const query = search.querySelector('.query') as HTMLInputElement;
  const results = search.querySelector('.results') as HTMLUListElement;
  search.addEventListener('submit', async (e: SubmitEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const response = (await (
      await fetch(`/_/search/?q=${encodeURIComponent(query.value)}`)
    ) // TODO config
      .json())  as {
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
        div.innerHTML = `<li><a class="dropdown-item" href="${
          result.href
        }"><div class="name" data-score="${result.score}">${result.name}</div>${
          result.description
            ? `<div class="description">${result.description}</div>`
            : ''
        }</a></li>`;
        results.appendChild(div);
      });
    } else {
      results.innerHTML =
        '<li><a class="dropdown-item disabled" href="#">No results</a></li>';
    }
  });
  Helper.log('Search enabled');
}
