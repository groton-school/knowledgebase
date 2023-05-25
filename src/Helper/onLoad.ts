export const GoogleDocEmbedEvent = 'GoogleDocEmbed';
export const GoogleDocRemoveEvent = 'GoogleDocRemove';

function observe() {
  const observer = new MutationObserver((mutations) => {
    let embed = undefined;
    let remove = undefined;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        const elt = node as HTMLElement;
        if (elt.id === 'od-doc-document-first') {
          embed = elt.querySelector('.CMSgoogledocembed');
        }
      });
      mutation.removedNodes.forEach((node) => {
        const elt = node as HTMLElement;
        if (elt.id === 'od-doc-document-first') {
          remove = elt.querySelector('.CMSgoogledocembed');
        }
      });
    });
    if (embed) {
      document.body.dispatchEvent(
        new CustomEvent(GoogleDocEmbedEvent, { detail: embed })
      );
    }
    if (remove) {
      document.body.dispatchEvent(
        new CustomEvent(GoogleDocRemoveEvent, { detail: remove })
      );
    }
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
