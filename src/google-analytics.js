// Google analytics tag
const GA4ID = 'G-LW51J2WF8M';
((id) => {
  var s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_G4_ID}`;
  document.getElementsByTagName('head')[0].appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', id);
})(GA4ID);
