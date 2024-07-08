import SiteTree from './SiteTree';
import logo from './logo.png';
// TODO config
import './styles.scss';

export default function Navbar() {
  const nav = document.createElement('nav');
  nav.classList.add('navbar', 'navbar-expand-lg', 'fixed-top');
  nav.id = 'nav';
  // TODO template
  nav.innerHTML = `
      <div class="container-fluid align-items-middle">
          <a class="navbar-brand" href="/tc"><img src="${logo}"></a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul id="site-tree" class="navbar-nav"></ul>
            <form role="search" id="search">
              <div class="input-group">
                <input class="form-control type="search" placeholder="How do I…" aria-label="Search">
                <button class="btn btn-outline-light" type="submit">Search</button>
              </div>
            </form>
          </div>
        </div>
      `;
  document.body.prepend(nav);

  new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target.id == 'nav')
        document.body.style.setProperty(
          '--nav-height',
          `${entry.target.clientHeight}px`
        );
    }
  }).observe(nav);

  SiteTree();
}
