import Embed from './Embed';
import Functionality from './Functionality';
import Helper from './Helper';
import UI from './UI';

/* eslint-disable @typescript-eslint/no-var-requires */
const pkg = require('../package.json');

Helper.onLoad.activate();

Helper.require([
  `https://storage.googleapis.com/${process.env.BUCKET_NAME as string
  }/build/kb-${pkg.version}.css${process.env.DEBUGGING ? `?cache=${crypto.randomUUID()}` : ''
  }`
]);

Functionality();
UI();
Embed();
