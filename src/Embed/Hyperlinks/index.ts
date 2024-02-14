import AppStore from './AppStore';
import Swank from './Swank';
import Vimeo from './Vimeo';
import YouTube from './YouTube';
import ChromeWebStore from './ChromeWebStore';
import WorkspaceMarketplace from './WorkspaceMarketplace';

export default function Hyperlinks() {
  AppStore();
  Swank();
  Vimeo();
  YouTube();
  ChromeWebStore();
  WorkspaceMarketplace();
}
