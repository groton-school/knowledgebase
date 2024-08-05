import Helper from '../../Helper';
import './styles.scss';

export default function Search() {
  document.querySelector('#wrapper')?.insertAdjacentHTML(
    'afterbegin',
    `
      <div id="search-results" class="card col-md-3 order-md-3 sticky-lg-top">
        <div class="card-body">
          <h5 class="card-title">Search Results</h5>
          <div class="card-text">
            <div class="dynamic-content"></div>
          </div>
        </div>
      </div>
    `
  );

  document.querySelector('#navbarSupportedContent')?.insertAdjacentHTML(
    'beforeend',
    `
    <form role="search" id="search" class="ms-auto">
      <div class="input-group">
        <input class="form-control" name="query" type="search" placeholder="How do I…" aria-label="Search">
        <button class="btn btn-outline-light" type="submit">Search</button>
      </div>
    </form>
`
  );
  Helper.log('Search added to DOM');
}
