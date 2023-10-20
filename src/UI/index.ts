import './fixed-background.scss';
import HighlightAnchor from './HighlightAnchor';
import './link-label-by-group.scss';
import Permalinks from './Permalinks';
import TOC from './TOC';
import './inline-images-match-text-size.scss';
import './hide-header-and-footer.scss';
import H6IsNormalText from './H6IsNormalText';
import TitleCaseAllCapsHeaders from './TitleCaseAllCapsHeaders';

/**
 * Extend and enhance the user interface of Overdrive
 *
 * The goal is to add utility, but not become necessary: add nothing that will
 * make the site unusable if removed.
 */
export default function UI() {
  TitleCaseAllCapsHeaders();
  Permalinks();
  TOC();
  H6IsNormalText();
  HighlightAnchor();
}
