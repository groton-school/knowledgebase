import * as API from '@groton/knowledgebase.api';
import * as Helper from '../../Helper';
import { label } from '../../UI/LinkLabelByGroup';

export async function SiteTree() {
  const pages = (await (
    await fetch(API.SiteTree.path)
  ).json()) as API.SiteTree.PageList;
  pages.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
  const tree = document.querySelector('#site-tree');
  pages.map((page) => {
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
      a.classList.add('active');
    }
    li.appendChild(a);
    label(a);
    tree?.appendChild(li);
  });
  Helper.log('Site tree built');
}
