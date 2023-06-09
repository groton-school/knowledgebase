declare global {
  interface Window {
    dataLayer: any;
  }
}

/**
 * Add Google Analytics tracking to pages
 *
 * The tracking ID for the analytics account is stored in `.env` file at the
 * project root in the `GOOGLE_ANALYTICS_G4_ID` value. This uses the modern
 * G4-style tracking ID rather than the old-style UA ID that Overdrive
 * provides built-in support for.
 */
export default function GoogleAnalytics() {
  const id = process.env.GOOGLE_ANALYTICS_G4_ID || '';
  const lib: HTMLScriptElement = document.createElement('script');
  lib.async = true;
  lib.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(lib);
  window.dataLayer = window.dataLayer || [];

  function gtag(...args: (string | Date)[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', id);
}
