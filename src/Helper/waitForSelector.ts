/*
 * Wait for a selector to appear on the page
 */

const process = (parent: HTMLElement, selector: string): HTMLElement[] =>
  Array.from(parent.querySelectorAll(selector));

/**
 * Wait for a particular DOM element to be ready and then return its child
 * elements matching a selector
 *
 * @param selector Selector for child elements to be returned
 * @param parentSelector Selector of DOM element to wait for
 *   (Optional, defaults to `'.CMSgoogledocembed'` matching an embedded
 *   Google Doc page)
 * @returns An array of elements matching `selector`
 */
export default function waitForSelector(
  selector: string,
  parentSelector = '.CMSgoogledocembed'
): Promise<HTMLElement[]> {
  return new Promise((resolve) => {
    const parent = document.querySelector(parentSelector) as HTMLElement;
    if (parent) {
      return resolve(process(parent, selector));
    }

    const observer = new MutationObserver(() => {
      const parent = document.querySelector(parentSelector) as HTMLElement;
      if (parent) {
        resolve(process(parent, selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
