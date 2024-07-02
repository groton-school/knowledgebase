import { CleanGooglePassThrough } from './CleanGooglePassThrough';
import Embiggen from './Embiggen';
import H6IsNormalText from './H6IsNormalText';
import HideHeaderAndFooter from './HideHeaderAndFooter';
import HighlightAnchor from './HighlightAnchor';
import PageStructure from './PageStructure';
import Permalinks from './Permalinks';
import TOC from './TOC';
import TitleCaseAllCapsHeaders from './TitleCaseAllCapsHeaders';
import './google-docs.scss';
import './link-label-by-group.scss';
import './unlock-img-width.scss';

/**
 * Extend and enhance the user interface of Overdrive
 *
 * The goal is to add utility, but not become necessary: add nothing that will
 * make the site unusable if removed.
 */
export default function UI() {
  PageStructure();
  HideHeaderAndFooter();
  TitleCaseAllCapsHeaders();
  TOC();
  Permalinks();
  H6IsNormalText();
  Embiggen();
  HighlightAnchor();
  CleanGooglePassThrough();
}
