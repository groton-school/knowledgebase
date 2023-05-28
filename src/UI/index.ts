import './fixed-background.scss';
import HighlightAnchor from './HighlightAnchor';
import './link-label-by-group.scss';
import Permalinks from './Permalinks';
import './space-after-paragraph.scss';
import TOC from './TOC';
import UnstackMobile from './UnstackMobile';

export default function UI() {
  Permalinks();
  TOC();
  HighlightAnchor();
  UnstackMobile();
}
