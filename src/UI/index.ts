import './fixed-background.scss';
import HighlightAnchor from './HighlightAnchor';
import './link-label-by-group.scss';
import Permalinks from './Permalinks';
import './space-after-paragraph.scss';
import TOC from './TOC';
// import FullHeightArticle from './FullHeightArticle';
import './fix-inline-image-offset.scss';

/**
 * Extend and enhance the user interface of Overdrive
 *
 * The goal is to add utility, but not become necessary: add nothing that will
 * make the site unusable if removed.
 */
export default function UI() {
  //FullHeightArticle();
  Permalinks();
  TOC();
  HighlightAnchor();
}
