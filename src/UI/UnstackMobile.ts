import Helper from '../Helper';
import './UnstackMobile.scss';

export default function UnstackMobile() {
  if (window.innerWidth <= 576) {
    Helper.onSelectorReady('.grid-stack-item-content').then(() =>
      Array.from(document.querySelectorAll('.grid-stack-item-content')).forEach(
        (item) => {
          item.classList.remove('grid-stack-item-content');
          item
            .querySelector('.CMSgoogledocembed')
            ?.classList.add('unstack-mobile');
        }
      )
    );
  }
}
