export default function RedirectBrokenLinkToSearch() {
  if (document.querySelector('#od-messagepage-alert')) {
    window.location.href = `${window.location.protocol}//${window.location.hostname
      }/search?q=${window.location.pathname.replace(/[^a-z0-9]+/gi, '%20')}#${window.location.hash
      }`;
  }
}
