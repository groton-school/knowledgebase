import { DOM } from './DOM';
import { Embed } from './Embed';
import * as Helper from './Helper';
import { UI } from './UI';

// from webpack
declare const __webpack_hash__: string;
declare const __PKG_NAME__: string;
declare const __PKG_VERSION__: string;

const DEBUGGING = JSON.parse(process.env.DEBUGGING || '');

Helper.vanity(
  `${__PKG_NAME__}\nv${__PKG_VERSION__}.${__webpack_hash__}\n${
    DEBUGGING ? 'X' : '✓'
  } webpack.mode ${DEBUGGING ? 'development' : 'production'}`
);

if (DOM()) {
  UI();
  Embed();
}

Helper.onLoad.activate();
