/*
 * Only works for _embedded_ (not framed) pages
 */

const waitForGoogleDocEmbed = require('./wait-for-google-doc-embed');

waitForGoogleDocEmbed('p:has(a[href^="https://youtu"])').then((paragraphs) => {
  paragraphs.forEach((p) => {
    const link = p.querySelector('a[href^="https://youtu"]');
    const url = link.href;
    const id = link.href.replace(
      /^https:\/\/(?:youtu\.be)|(?:(?:www\.)?youtube\.com\/watch\?v=)\/(.+)\/?/,
      '$1'
    );
    p.outerHTML = `<iframe width="100%" height="315" src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    console.log(`embedded video ${url}`);
  });
});
