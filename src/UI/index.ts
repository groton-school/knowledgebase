import Helper from '../Helper';
import './fixed-background.scss';
import './hide-topnav.scss';
import HighlightAnchor from './HighlightAnchor';
import './less-stripey-tables.scss';
import Permalinks from './Permalinks';
import './readable-width.scss';
import './space-after-paragraph.scss';
import TOC from './TOC';
import UnstackMobile from './UnstackMobile';

export default function UI() {
  Helper.onLoad.addCallback(() => {
    Permalinks();
    TOC();
    HighlightAnchor();
    UnstackMobile();
  });
}
