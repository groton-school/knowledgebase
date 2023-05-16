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
