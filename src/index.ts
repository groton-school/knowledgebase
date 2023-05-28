import Embed from './Embed';
import Functionality from './Functionality';
import Helper from './Helper';
import UI from './UI';

const pkg = require('../package.json');

Helper.onLoad.activate();
Helper.require([
  `https://storage.googleapis.com/${process.env.BUCKET_NAME || ''}/build/kb-${pkg.version
  }.css`
]);

Functionality();
UI();
Embed();
