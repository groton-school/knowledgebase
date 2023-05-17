import Helper from '../Helper';

function iframeMessage() {
  Helper.onSelectorReady('.od-iframe-loader').then((frame) => {
    frame.innerHTML =
      process.env.THIRD_PARTY_COOKIES_CONTENT ||
      '<h1>Please enable third-party cookies</h1>';
    frame.classList.add('loaded');
  });
}

function receiveMessage(e: MessageEvent) {
  if (e.data === 'MM:3PCunsupported') {
    Helper.log('Third-party cookies are not enabled');
    iframeMessage();
  } else if (e.data === 'MM:3PCsupported') {
    // Helper.log('Third-party cookies are enabled');
  }
}

/**
 * Test to see if third party cookies are enabled
 *
 * @see https://github.com/groton-school/3rdpartycookiecheck
 *
 * 3rdpartycookiecheck needs to be hosted on a separate domain (e.g. GAE) and
 * the `THIRD_PARTY_COOKIES` key in `.env` must be set to the path to the root
 * of 3rdpartycookiecheck.
 */
export default function ThirdPartyCookies() {
  window.addEventListener('message', receiveMessage, false);
  const iframe = document.createElement('iframe');
  iframe.src = `${process.env.THIRD_PARTY_COOKIES}/start.html`;
  iframe.style.display = 'none';
  document.body.append(iframe);
}
