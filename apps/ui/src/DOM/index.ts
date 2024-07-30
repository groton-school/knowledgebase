import Constants from '../Constants';
import Helper from '../Helper';
import Directory from './Content/Directory';
import GoogleDocEmbed from './Content/GoogleDocEmbed';
import Head from './Head';
import Navbar from './Navbar';
import Redirect from './Redirect';
import Search from './Search';
import './styles.scss';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function PageStructure() {
  if (!Redirect()) {
    Head();
    Navbar();

    let wrapper = document.createElement('div');
    wrapper.id = 'wrapper'; // TODO constant
    wrapper.classList.add('overflow-y-auto');
    let row = document.createElement('div');
    row.classList.add('row', 'align-items-start');
    wrapper.appendChild(row);
    const content = document.querySelector(
      `${Constants.styles.googleDocEmbed}, #directory`
    ) as HTMLDivElement;
    if (content) {
      wrapper = content.parentElement?.insertBefore(wrapper, content)!;
      row.appendChild(content);
      switch (content.id) {
        case 'doc-content': // TODO constant fix
          GoogleDocEmbed(content);
          break;
        case 'directory': // TODO constant?
          Directory(content);
          break;
      }
    } else {
      document.body.appendChild(wrapper);
    }

    Helper.log(`Added metadata and Navbar`);
    Search();
    return true;
  }
  return false;
}
