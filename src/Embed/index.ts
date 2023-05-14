import Helper from '../Helper';
import IFrames from './IFrames';
import Swank from './Swank';
import YouTube from './YouTube';

export default function Embed() {
  Helper.onLoad.addCallback(() => {
    IFrames();
    Swank();
    YouTube();
  });
}
