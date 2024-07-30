import Helper from '../Helper';

export default function Search() {
  document.querySelector('#wrapper .row')?.insertAdjacentHTML(
    'afterbegin',
    `
      <div class="search col card m-1 p-3">
        <div class="card-body">
          <ul class="results"></ul>
        </div>
      </div>
    `
  );

  document.querySelector('#navbarSupportedContent')?.insertAdjacentHTML(
    'beforeend',
    `
    <form role="search" id="search" class="ms-auto">
      <div class="input-group">
        <div class="dropdown">
        <input class="form-control query" type="search" placeholder="How do I…" aria-label="Search">
      </div>
          <button class="btn btn-outline-light" type="submit">Search</button>
        </div>
    </form>
`
  );
  Helper.log('Search added to DOM');
}
