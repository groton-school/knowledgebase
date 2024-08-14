import Constants from '../../../Constants';
import Helper from '../../../Helper';
import ImageCanvas from './ImageCanvas';
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
  directory.classList.add('card-body', 'row', 'align-items-stretch');
  directory.parentElement?.insertBefore(card, directory);
  card.appendChild(directory);
  Array.from(directory.querySelectorAll('.page')).forEach((page) =>
    PageThumbnail(page as HTMLElement)
  );

  const title = directory.querySelector('.title') as HTMLElement;
  if (title) {
    ImageCanvas({
      href: window.location.href,
      parent: title,
      propertyParent: card,
      isDirectory: true
    });
  }
  Helper.log('Updated #directory DOM');
}
