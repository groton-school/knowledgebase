import Constants from '../../Constants';
import Helper from '../../Helper';
import config from '../../config';
import './styles.scss';

export default function Search() {
  document.querySelector('#wrapper')?.insertAdjacentHTML(
    'afterbegin',
    `
      <div id="search-results" class="card col order-md-3 ${Constants.bootstrap.padding} ${Constants.bootstrap.margin} sticky-lg-top">
        <div class="card-body">
          <h5 class="card-title">Search Results</h5>
          <div class="card-text">
            <div class="dynamic-content"></div>
          </div>
        </div>
      </div>
    `
  );

  document.querySelector('.navbar-collapse')?.insertAdjacentHTML(
    'beforeend',
    `
    <form role="search" id="search" class="ms-auto">
      <div class="input-group">
        <input class="form-control" name="query" type="search" placeholder="How do I…" aria-label="Search" data-bs-theme="${
          (config.site.dark && config.site.darkSearchForm === undefined) ||
          config.site.darkSearchForm
            ? 'dark'
            : 'light'
        }">
        <button class="btn btn-outline-light" type="submit" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">Search</button>
      </div>
    </form>
`
  );
  Helper.log('Search added to DOM');
}
