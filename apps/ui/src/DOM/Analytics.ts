import Helper from '../Helper';
import config from '../config';

declare global {
  interface Window {
    dataLayer: Record<string, any>;
  }
}

export default async function Analytics() {
  await Helper.addScript(
    `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalytics.trackingId}`
  );
  const s = document.createElement('script');
  s.innerHTML = `window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', '${config.googleAnalytics.trackingId}');`;
  document.body.append(s);
  Helper.log('Google Analytics loaded');
}
