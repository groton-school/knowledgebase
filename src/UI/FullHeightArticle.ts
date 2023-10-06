import Helper from '../Helper';

export default function FullHeightArticle() {
  Helper.onSelectorReady<HTMLElement>(
    '.grid-stack-item[data-gs-height]:has(.grid-stack-item-content .CMSgoogledocembed)'
  ).then((items: HTMLElement[]) => {
    items.forEach((item) => {
      delete item.dataset.gsHeight;
      (item.querySelector(
        '.grid-stack-item-content'
      ) as HTMLElement)!.style.height = 'fit-content';
      (item.querySelector('.panel-body') as HTMLElement)!.style.height =
        'fit-content';
      console.log('full height article');
    });
  });
}
