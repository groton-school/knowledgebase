/** Name of the Google Doc embed custom event */
export const GoogleDocEmbedEvent = 'kbe';

/** Name of the Google Doc remove event */
export const GoogleDocRemoveEvent = 'kbr';

/** CSS selector for root of embedded Google Doc */
export const GoogleDocEmbedSelector = '.CMSgoogledocembed';

/**
 * Observe the DOM for added or removed Google Doc embeds
 *
 * Embedding a Google Doc fires a custom event with the `details` property
 * referencing the embedded doc. Removing an embedded doc fires a simple
 * event with no `details` property.
 */
function observe() {
  const observer = new MutationObserver((mutations) => {
    let embed = undefined;
    mutations.forEach((mutation) => {
      if (
        Array.from(mutation.removedNodes).reduce((removed, node) => {
          if (!removed) {
            const elt = node as HTMLElement;
            if (
              elt.id === 'od-doc-document-first' ||
              elt.id === 'od-grid-stack'
            ) {
              return true;
            }
          }
          return removed;
        }, false)
      ) {
        document.body.dispatchEvent(new Event(GoogleDocRemoveEvent));
      }
      if (
        (embed = Array.from(mutation.addedNodes).reduce(
          (embedded: Element | null, node) => {
            if (!embedded) {
              const elt = node as HTMLElement;
              if (elt.id === 'od-doc-document-first') {
                return elt.querySelector(GoogleDocEmbedSelector);
              }
            }
            return embedded;
          },
          null
        ))
      ) {
        document.body.dispatchEvent(
          new CustomEvent(GoogleDocEmbedEvent, { detail: embed })
        );
      }
    });
  });
  const embedded = document.querySelector(GoogleDocEmbedSelector);
  if (embedded) {
    document.body.dispatchEvent(
      new CustomEvent(GoogleDocEmbedEvent, { detail: embedded })
    );
  }
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Load the core MutationObservers on the page when loaded
 */
export function activate() {
  if (document.readyState === 'loading') {
    window.addEventListener('load', observe);
  } else {
    observe();
  }
}
