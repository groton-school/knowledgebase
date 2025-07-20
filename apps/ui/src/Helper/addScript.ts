import { URLString } from '@battis/descriptive-types';

export async function addScript(src: URLString) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.addEventListener('load', resolve);
    el.addEventListener('error', reject);
    document.body.append(el);
  });
}
