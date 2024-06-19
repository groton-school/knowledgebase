import Helper from '../Helper';

/** @type {string} Default instructions if `.env` unconfigured */
const DEFAULT_INSTRUCTIONS = '<h1>Please enable third-party cookies</h1>';

/**
 * Display instructions to user if 3rd-party cookies are disabled
 */
function showCookieInstructions() {
  Helper.onSelectorReady<HTMLIFrameElement>('.od-iframe-loader').then(
    (frames) =>
      frames.forEach((frame) => {
        frame.innerHTML =
          process.env.THIRD_PARTY_COOKIES_CONTENT || DEFAULT_INSTRUCTIONS;
        frame.classList.add('loaded');
      })
  );
}

/**
 * Receive message from `3rdpartycookiecheck` iframe re: 3PC state
 */
function receiveMessage(e: MessageEvent) {
  if (e.data === 'MM:3PCunsupported') {
    Helper.log('3rd-party cookies disabled');
    showCookieInstructions();
  }
}

/**
 * Test to see if 3rd-party cookies are enabled
 *
 * @see https://github.com/groton-school/3rdpartycookiecheck
 *
 * `3rdpartycookiecheck` needs to be hosted on a separate domain (e.g. GAE)
 * and the `THIRD_PARTY_COOKIES` key in `.env` must be set to the URL of that
 * server instance.
 */
export default function ThirdPartyCookies() {
  window.addEventListener('message', receiveMessage, false);
  document.body.append(
    Helper.iframe(
      `${process.env.THIRD_PARTY_COOKIES}/start.html`,
      undefined,
      false
    )
  );
}
