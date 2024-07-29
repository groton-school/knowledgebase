import pkg from '../package.json';
import DOM from './DOM';
import Embed from './Embed';
import Helper from './Helper';
import UI from './UI';
import '@battis/webpack';

Helper.vanity(
  `${pkg.name}\nv${pkg.version}.${__webpack_hash__}\n${
    JSON.parse(process.env.DEBUGGING || '') ? 'X' : '✓'
  } webpack.mode ${
    JSON.parse(process.env.DEBUGGING!) ? 'development' : 'production'
  }`
);

if (DOM()) {
UI();
Embed();
}

Helper.onLoad.activate();
