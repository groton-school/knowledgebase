import { GoogleDocEmbedEvent } from './onLoad';

/**
 * Bind a handler to the event fired when a Google Doc is embedded
 *
 * The `handler` requests an array of DOM elements within the Google Doc
 * specified by the `selector`
 *
 * @param {string} selector Valid CSS selector
 * @param {Function} handler
 */
export default function onGoogleDocEmned(
  selector: string,
  handler: (elts: HTMLElement[]) => any
) {
  document.body.addEventListener(GoogleDocEmbedEvent, (e) => {
    if (e instanceof CustomEvent) {
      handler(Array.from(e.detail.querySelectorAll(selector)));
    }
  });
}
