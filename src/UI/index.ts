import './fixed-background.scss';
//import './hide-topnav.scss';
import HighlightAnchor from './HighlightAnchor';
import LinkForGroup from './Link for Group';
import Permalinks from './Permalinks';
import './readable-width.scss';
import './space-after-paragraph.scss';
import TOC from './TOC';
import UnstackMobile from './UnstackMobile';

export default function UI() {
  Permalinks();
  TOC();
  HighlightAnchor();
  LinkForGroup();
  UnstackMobile();
}
