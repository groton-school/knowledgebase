import AppStore from './AppStore';
import ChromeWebStore from './ChromeWebStore';
import Swank from './Swank';
import Vimeo from './Vimeo';
import WorkspaceMarketplace from './WorkspaceMarketplace';
import YouTube from './YouTube';

export default function Hyperlinks() {
  AppStore();
  Swank();
  Vimeo();
  YouTube();
  ChromeWebStore();
  WorkspaceMarketplace();
}
