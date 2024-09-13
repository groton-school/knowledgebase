/// <reference types="@battis/webpack/types" />
import pkg from '../package.json';
import DOM from './DOM';
import Embed from './Embed';
import Helper from './Helper';
import UI from './UI';

const DEBUGGING = JSON.parse(process.env.DEBUGGING || '');

Helper.vanity(
  `${pkg.name}\nv${pkg.version}.${__webpack_hash__}\n${
    DEBUGGING ? 'X' : '✓'
  } webpack.mode ${DEBUGGING ? 'development' : 'production'}`
);

if (DOM()) {
  UI();
  Embed();
}

Helper.onLoad.activate();
