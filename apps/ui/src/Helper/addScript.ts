import { UrlString } from '@groton/knowledgebase.domain';

export default async function addScript(src: UrlString) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.addEventListener('load', resolve);
    el.addEventListener('error', reject);
    document.body.append(el);
  });
}
