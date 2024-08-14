import Constants from '../../../Constants';
import Helper from '../../../Helper';
import config from '../../../config';
import PageThumbnail from './PageThumbnail';
import './styles.scss';

export default function Directory(directory: HTMLDivElement) {
  const card = document.createElement('div');
  card.classList.add(
    'card',
    'col-md-9',
    'order-md-1',
    Constants.bootstrap.padding,
    Constants.bootstrap.margin
  ); // TODO config spacing
  directory.classList.add('card-body', 'row', 'align-items-center');
  directory.parentElement?.insertBefore(card, directory);
  card.appendChild(directory);
  Array.from(directory.querySelectorAll('.page')).forEach(PageThumbnail);

  const title = document.querySelector('.title');
  if (title) {
    const thumbnail = document.createElement('span');
    thumbnail.className = 'thumbnail';
    thumbnail.innerHTML = `
        <img class="img-fluid" onerror="this.src='${
          config.directory.thumbnails.default
        }'" src="${
      config.directory.thumbnails.root
    }${window.location.pathname.replace(/\/$/, '')}.png" />
      `;
    title.prepend(thumbnail);
  }
  Helper.log('Updated #directory DOM');
}
