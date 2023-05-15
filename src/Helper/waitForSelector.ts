/*
 * Wait for a selector to appear on the page
 */

const EMBED_SELECTOR = '.CMSgoogledocembed';

const process = (parent: HTMLElement, selector: string): HTMLElement[] =>
  Array.from(parent.querySelectorAll(selector));

/**
 * Wait for a particular DOM element to be ready and then return its child
 * elements matching a selector
 *
 * @param selector Selector for child elements to be returned
 * @param EMBED_SELECTOR Selector of DOM element to wait for
 *   (Optional, defaults to `'.CMSgoogledocembed'` matching an embedded
 *   Google Doc page)
 * @returns An array of elements matching `selector`
 */
export default function waitForSelector(
  selector: string
): Promise<HTMLElement[]> {
  return new Promise((resolve, reject) => {
    const parent = document.querySelector(EMBED_SELECTOR) as HTMLElement;
    if (parent) {
      return resolve(process(parent, selector));
    }
    // FIXME detect framed document and abort waiting for embed
    const observer = new MutationObserver(() => {
      const parent = document.querySelector(EMBED_SELECTOR) as HTMLElement;
      if (parent) {
        resolve(process(parent, selector));
        observer.disconnect();
      } else if (document.querySelector('.od-iframe-loader, .folder-item')) {
        reject();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
