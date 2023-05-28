/**
 * Watch the DOM for a particular selector to be present
 *
 * @param {string} selector Valid CSS selector for target element
 * @param {string} rejectSelector (Optional) Valid CSS selector for elements
 *    that, if found, indicate that the target element will not be found and
 *    the observer should be discontinued
 */
export default function onSelectorReady(
  selector: string,
  rejectSelector?: string
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const elt = document.querySelector(selector) as HTMLElement;
    if (elt) {
      return resolve(elt);
    } else if (rejectSelector && document.querySelector(rejectSelector)) {
      reject();
    }
    const observer = new MutationObserver(() => {
      const elt = document.querySelector(selector) as HTMLElement;
      if (elt) {
        resolve(elt);
        observer.disconnect();
      } else if (rejectSelector && document.querySelector(rejectSelector)) {
        reject();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
