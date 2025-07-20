import * as Constants from '../../Constants';
import { config } from '../../config';
import { SiteTree } from './SiteTree';
import './styles.scss';

// TODO config logo

export function Navbar() {
  const nav = document.createElement('nav');
  nav.classList.add('navbar', 'navbar-expand-lg', 'bg-primary', 'fixed-top');
  nav.id = 'nav';
  if (config.site.dark) {
    nav.setAttribute('data-bs-theme', 'dark');
  } // TODO template
  // TODO consolidate Search in one directory
  nav.innerHTML = `
      <div class="container-fluid align-items-middle">
          <a class="navbar-brand" href="/tc">
            <img src=${Constants.styles.logo}>
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul id="site-tree" class="navbar-nav"></ul>
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
