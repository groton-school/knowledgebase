import * as Constants from '../../Constants';
import Helper from '../../Helper';
import './styles.scss';

/*
 * FIXME unstacking GridStack not working
 *   Seems to work okay for folder views (citation needed), but definitely
 *   not for embedded documents
 */

const GRID_STACK_ITEM_CONTENT = 'grid-stack-item-content';
const GRID_STACK_ITEM_CONTENT_SELECTOR = `.${GRID_STACK_ITEM_CONTENT}`;

export default function UnstackMobile() {
  if (window.innerWidth <= Constants.mobileWidth) {
    Helper.onSelectorReady(GRID_STACK_ITEM_CONTENT_SELECTOR).then(() =>
      Array.from(
        document.querySelectorAll(GRID_STACK_ITEM_CONTENT_SELECTOR)
      ).forEach((item) => {
        item.classList.remove(GRID_STACK_ITEM_CONTENT);
        item
          .querySelector(Helper.onLoad.GoogleDocEmbedSelector)
          ?.classList.add('unstack-mobile');
      })
    );
  }
}
