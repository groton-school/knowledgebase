import { GoogleDocEmbedEvent } from './onLoad';

export default function onGoogleDocEmned(
  selector: string,
  callback: (elts: HTMLElement[]) => any
) {
  document.body.addEventListener(GoogleDocEmbedEvent, (e) => {
    if (e instanceof CustomEvent) {
      callback(Array.from(e.detail.querySelectorAll(selector)));
    }
  });
}
