/*
 * Only works for _embedded_ (not framed) pages
 */

const waitFor = require('./wait-for');

waitFor('.CMSgoogledocembed').then((embed) => {
  Array.from(embed.querySelectorAll('a[href^="https://youtu"]')).forEach(
    (link) => {
      const id = link.href.replace(
        /^https:\/\/(?:youtu\.be)|(?:(?:www\.)?youtube\.com\/watch\?v=)\/(.+)\/?/,
        '$1'
      );
      link.outerHTML = `<iframe width="100%" height="315" src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
  );
});
