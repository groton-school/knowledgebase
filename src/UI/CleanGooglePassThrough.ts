import Helper from '../Helper';

export function CleanGooglePassThrough() {
  Helper.onGoogleDocEmbed<HTMLAnchorElement>('a', (links) => {
    links.forEach((link) => {
      const url = new URL(link.href);
      link.href = url.searchParams.get('q') || link.href;
    });
  });
}
