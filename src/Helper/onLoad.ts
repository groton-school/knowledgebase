type LocationChangeEventHandler = () => void;

let PREV_PATH = window.location.pathname;

const queue: LocationChangeEventHandler[] = [];

/**
 * @see https://stackoverflow.com/a/46428962/294171
 */
function observeUrlChange() {
  const body = document.querySelector('body');
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      if (PREV_PATH !== window.location.pathname) {
        PREV_PATH = window.location.pathname;
        queue.forEach((callback) => callback());
      }
    });
  });
  body && observer.observe(body, { childList: true, subtree: true });
}

export function activate() {
  if (document.readyState == 'loading') {
    window.addEventListener('load', observeUrlChange);
  } else {
    observeUrlChange();
  }
}

export function addCallback(callback: LocationChangeEventHandler) {
  callback();
  queue.push(callback);
}
