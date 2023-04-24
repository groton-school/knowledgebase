/*
 * Suggested approach: paste IFRAME embed into Google Doc, set text to white
 * and 1pt size, with a placeholder link inside the IFRAME tag
 */

const waitForGoogleDocEmbed = require('./wait-for-google-doc-embed');

waitForGoogleDocEmbed('p').then((paragraphs) => {
  paragraphs.forEach((p) => {
    if (/^<iframe.*<\/iframe>$/.test(p.innerText)) {
      const url = p.innerText.replace(/^.*src="([^"]+)".*$/, '$1');
      p.outerHTML = p.innerText;
      console.log(`embedded iframe ${url}`);
    }
  });
});
