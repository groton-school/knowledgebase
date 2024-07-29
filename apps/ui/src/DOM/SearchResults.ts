export default function SearchResults() {
  document
    .querySelector('#wrapper')
    ?.insertAdjacentHTML(
      'afterbegin',
      `<div class="search"><ul class="results"></ul></div>`
    );
}
