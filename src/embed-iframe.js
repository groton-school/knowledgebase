/*
 * Suggested approach: paste IFRAME embed into Google Doc, set text to white
 * and 1pt size, with a placeholder link inside the IFRAME tag
 */

const waitFor = require('./wait-for');

waitFor('.CMSgoogledocembed').then((embed) => {
  Array.from(embed.querySelectorAll('p')).forEach((p) => {
    console.log(p.innerText);
    if (/^<iframe.*<\/iframe>$/.test(p.innerText)) {
      console.log('MATCH');
      p.outerHTML = p.innerText;
    }
  });
});
