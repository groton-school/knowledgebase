/*
 * Wait for a selector to appear on the page
 */

module.exports = (selector) => {
  const googleDocEmbed = '.CMSgoogledocembed';
  return new Promise((resolve) => {
    if (document.querySelector(googleDocEmbed)) {
      return resolve(document.querySelector(googleDocEmbed));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(googleDocEmbed)) {
        resolve(
          Array.from(
            document.querySelector(googleDocEmbed).querySelectorAll(selector)
          )
        );
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
};
