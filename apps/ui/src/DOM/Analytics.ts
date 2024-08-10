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
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', config.googleAnalytics.trackingId);
  Helper.log('Google Analytics loaded');
}
