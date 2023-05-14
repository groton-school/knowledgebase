import Helper from '../Helper';
import './hide-topnav.scss';
import HighlightAnchor from './HighlightAnchor';
import './less-stripey-tables.scss';
import Permalinks from './Permalinks';
import TOC from './TOC';

export default function UI() {
  Helper.onLoad.addCallback(() => {
    Permalinks();
    TOC();
    HighlightAnchor();
  });
}
