import path from 'path-browserify';
import Helper from '../Helper';

export default function BreadCrumbs(root: HTMLElement) {
  const parts = path
    .dirname(window.location.pathname)
    .split('/')
    .filter((part) => part != '');
  let trail = '/';
  root?.insertAdjacentHTML(
    'afterbegin',
    `<div class="card col-md-9 m-1">
      <div class="card-body">
        <nav aria=label="breadcrumb">
          <ol class="breadcrumb m-0">
            <li class="breadcrumb-item"><a href="/"><i class="bi bi-house-fill"></i></a></li>
            ${parts
              .map((part: string) => {
                trail = path.join(trail, part);
                return `<li class="breadcrumb-item"><a href="${trail}">${part}</a></li>`;
              })
              .join('\n')}
            <li class="breadcrumb-item active">${path.basename(window.location.pathname)}</i>
          </ol>
        </nav>
      </div>
    </div>`
  );
  Helper.log('Breadcrumbs trailed');
}
