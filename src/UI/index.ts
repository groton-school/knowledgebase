import './fixed-background.scss';
import HighlightAnchor from './HighlightAnchor';
import './link-label-by-group.scss';
import Permalinks from './Permalinks';
import TOC from './TOC';
import H6IsNormalText from './H6IsNormalText';
import TitleCaseAllCapsHeaders from './TitleCaseAllCapsHeaders';
import './google-docs.scss';
import HideHeaderAndFooter from './HideHeaderAndFooter';
import './unlock-img-width.scss';
import Embiggen from './Embiggen';

/**
 * Extend and enhance the user interface of Overdrive
 *
 * The goal is to add utility, but not become necessary: add nothing that will
 * make the site unusable if removed.
 */
export default function UI() {
  HideHeaderAndFooter();
  TitleCaseAllCapsHeaders();
  Permalinks();
  TOC();
  H6IsNormalText();
  Embiggen();
  HighlightAnchor();
}
