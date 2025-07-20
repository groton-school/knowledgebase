/**
 * Watch the DOM for a particular selector to be present
 *
 * @param {string} selector Valid CSS selector for target element
 * @param {string} rejectSelector (Optional) Valid CSS selector for elements
 *   that, if found, indicate that the target element will not be found and the
 *   observer should be discontinued
 */
export function onSelectorReady<T extends HTMLElement>(
  selector: string,
  rejectSelector?: string
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const elts = Array.from(document.querySelectorAll(selector)) as T[];
    if (elts.length) {
      return resolve(elts);
    } else if (rejectSelector && document.querySelector(rejectSelector)) {
      reject();
    }
    const observer = new MutationObserver(() => {
      const elts = Array.from(document.querySelectorAll(selector)) as T[];
      if (elts) {
        resolve(elts);
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
