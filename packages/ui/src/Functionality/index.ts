import MissingImages from './MissingImages';
import ThirdPartyCookies from './ThirdPartyCookies';

/**
 * Expand the functionality of Overdrive
 *
 * Change the behavior of the Overdrive app itself. While these may provide
 * enhanced functionality, the goal is to do nothing that will become a "core"
 * feature of the site, allowing these plugins to improve, but not become
 * necessary to, the functioning of the knowledgebase.
 */
export default function Functionality() {
  ThirdPartyCookies();
  MissingImages();
}
