import pkg from '../package.json';
import Embed from './Embed';
// import Functionality from './Functionality';
import Helper from './Helper';
import UI from './UI';
import '@battis/webpack';

Helper.vanity(
  `${pkg.name}\nv${pkg.version}.${__webpack_hash__}\n${
    JSON.parse(process.env.DEBUGGING || '') ? 'X' : '✓'
  } webpack.mode ${
    JSON.parse(process.env.DEBUGGING!) ? 'development' : 'production'
  }\n${
    /\?cache=/.test(
      (document.querySelector('script[src$="kb.js"]') as HTMLScriptElement).src
    )
      ? 'X GSC caching disabled'
      : '✓ GSC caching enabled'
  }`
);

// Functionality();
UI();
Embed();

Helper.onLoad.activate();
