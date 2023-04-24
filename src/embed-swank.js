const waitForGoogleDocEmbed = require('./wait-for-google-doc-embed');

waitForGoogleDocEmbed('p:has(a[href^="https://swank.hubs.vidyard.com"])').then(
  (paragraphs) => {
    paragraphs.forEach((p) => {
      const url = document.querySelector(
        'a[href^="https://swank.hubs.vidyard.com"]'
      ).href;
      const id = url.replace(/.*\/watch\/(.*)\??/, '$1');
      const title = Array.from(
        p.querySelectorAll('a[href^="https://swank.hubs.vidyard.com"]')
      ).reduce((title, link) => {
        if (link.innerText.trim().length && !/^http.*/.test(link.innerText)) {
          return link.innerText;
        }
        return title;
      }, '');
      p.outerHTML = `<iframe class="vidyard_iframe" title="${title}" src="https://play.vidyard.com/${id}?autoplay=0" width=100% height=360 scrolling="no" frameborder="0" allowtransparency="true" allowfullscreen></iframe>`;
      console.log(`embedded video https://swank.hubs.vidyard.com/watch/${id}`);
    });
  }
);
