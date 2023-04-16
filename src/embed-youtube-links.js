/*
 * Only works for _embedded_ (not framed) pages
 */

const waitFor = (selector) => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
};

console.log('Attempting to embed YouTube links…');
waitFor('.CMSgoogledocembed').then((embed) => {
  Array.from(embed.querySelectorAll('a[href^="https://youtu"]')).forEach(
    (link) => {
      const id = link.href.replace(
        /^https:\/\/(?:youtu\.be)|(?:(?:www\.)?youtube\.com\/watch\?v=)\/(.+)\/?/,
        '$1'
      );
      link.outerHTML = `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      console.log(`${id} embedded`);
    }
  );
});
