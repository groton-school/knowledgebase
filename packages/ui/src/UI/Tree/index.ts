import './styles.scss';

export default async function Tree() {
  const pages = await (await fetch('/_/toc')).json();
  const tree = document.querySelector('#tree');
  pages.map((page: { href: string; name: string; description?: string }) => {
    tree?.insertAdjacentHTML(
      'beforeend',
      `<div class="page"><a href="${page.href}"><div class="title">${
        page.name
      }</div>${
        page.description
          ? `<div class="description">${page.description}</div>`
          : ''
      }</a></div>`
    );
  });
}
