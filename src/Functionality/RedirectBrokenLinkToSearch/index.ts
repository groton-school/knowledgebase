import Helper from '../../Helper';
import './styles.scss';
import styles from './styles.module.scss';

const messageTextFor404 =
  'Sorry, the page you requested could not be found, or you do not have sufficient rights to access it.';

const redirectPath = 'kb-redirect';
const isRedirected = 'kb-redirected';

export default function RedirectBrokenLinkToSearch() {
  const search = new URLSearchParams(window.location.search);
  const alert = document.querySelector('#od-messagepage-alert') as HTMLElement;

  if (search.has(redirectPath)) {
    Helper.log(
      `temporarily redirected to / on the way to ${search.get(redirectPath)}`
    );

    /*
    const scrim = document.createElement('div');
    scrim.classList.add(styles.redirect, styles.scrim);

    const wrapper = document.createElement('div');
    wrapper.classList.add(styles.wrapper);
    scrim.appendChild(wrapper);

    const dialog = document.createElement('div');
    dialog.classList.add(styles.dialog);
    wrapper.appendChild(dialog);
    dialog.innerHTML = `
    <p>This is a hassle, and I apologize. I'm working with the developer to fix this problem.</p>
    <p>The short version: following a link to this site for your first visit doesn't always work right.</p>
    <p>Go ahead and close this tab. Then go back to the link that you clicked that took you here, and click it again. The second time it should take you straight in.</p>
    <p style="text-align: center">&mdash; Seth Battis</p>
    `;

    document.body.appendChild(scrim);
    */

    /*
    window.location.href = `${window.location.protocol}//${
      window.location.hostname
    }/${search.get(redirectPath)}?${isRedirected}=true`;
    */
  } else if (alert && alert.innerText.trim() == messageTextFor404) {
    if (search.has(isRedirected)) {
      Helper.log(
        `redirection to avoid 404 failed for ${window.location.pathname}, redirecting to search`
      );
      window.location.href = `${window.location.protocol}//${
        window.location.hostname
      }/search?q=${window.location.pathname.replace(/[^a-z0-9]+/gi, '%20')}#${
        window.location.hash
      }`;
    } else {
      Helper.log(
        `attempting to handle 404 error through redirection ${window.location.pathname}`
      );
      window.location.href = `${window.location.protocol}//${
        window.location.hostname
      }/?${redirectPath}=${encodeURIComponent(window.location.pathname)}`;
    }
  }
}
