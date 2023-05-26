export const GoogleDocEmbedEvent = 'kbe';
export const GoogleDocRemoveEvent = 'kbr';
export const GoogleDocEmbedSelector = '.CMSgoogledocembed';

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
  observer.observe(document.body, { childList: true, subtree: true });
}

export function activate() {
  if (document.readyState === 'loading') {
    window.addEventListener('load', observe);
  } else {
    observe();
  }
}
