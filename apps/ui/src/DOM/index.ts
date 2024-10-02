import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Constants from '../Constants';
import Helper from '../Helper';
import Analytics from './Analytics';
import BreadCrumbs from './BreadCrumbs';
import Directory from './Content/Directory';
import GoogleDocEmbed from './Content/GoogleDocEmbed';
import Head from './Head';
import Navbar from './Navbar';
import Redirect from './Redirect';
import Search from './Search';
import './styles.scss';

export default function PageStructure() {
  Analytics();
  if (!Redirect()) {
    Head();
    Navbar();

    let wrapper = document.createElement('div');
    wrapper.id = 'wrapper'; // TODO constant
    wrapper.classList.add(
      'overflow-y-auto',
      'row',
      'justify-content-center',
      'align-items-start',
      'm-1'
    );
    //    let row = document.createElement('div');
    //    row.classList.add('row', 'align-items-start');
    //    wrapper.appendChild(row);
    const content = document.querySelector(
      `${Constants.styles.googleDocEmbed}, #directory`
    ) as HTMLDivElement;
    if (content) {
      wrapper = content.parentElement?.insertBefore(wrapper, content)!;
      //      row.appendChild(content);
      wrapper.appendChild(content);
      switch (content.id) {
        case 'doc-content':
          GoogleDocEmbed(content);
          break;
        case 'directory': // TODO constant?
          Directory(content);
          break;
      }
      BreadCrumbs(wrapper);
    } else {
      document.body.appendChild(wrapper);
    }

    Helper.log(`Added metadata and Navbar`);
    Search();
    return true;
  }
  return false;
}
