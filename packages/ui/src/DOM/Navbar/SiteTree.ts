import Helper from '../../Helper';

export default async function SiteTree() {
  const pages = await (await fetch('/_/toc')).json();
  const tree = document.querySelector('#site-tree');
  pages.map((page: { href: string; name: string; description?: string }) => {
    const li = document.createElement('li');
    li.classList.add('nav-item');
    const a = document.createElement('a');
    a.classList.add('nav-link');
    a.href = page.href;
    a.setAttribute('data-bs-toggle', 'tooltip');
    a.setAttribute('data-bs-title', page.description || '');
    a.innerText = page.name;
    if (document.location.pathname.startsWith(page.href)) {
      a.setAttribute('aria-current', 'page');
      li.classList.add('active');
    }
    li.appendChild(a);
    tree?.appendChild(li);
  });
  Helper.log('Site tree built');
}
