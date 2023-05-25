import Helper from '../Helper';
import AppStoreLinks from './AppStoreLinks';
import IFrames from './IFrames';
import Image from './Image';
import Swank from './Swank';
import YouTube from './YouTube';

export default function Embed() {
  Helper.onLoad.addCallback(() => {
    IFrames();
    Image();
    Swank();
    YouTube();
    AppStoreLinks();
  });
}
