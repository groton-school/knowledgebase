import Embed from './Embed';
import Functionality from './Functionality';
import Helper from './Helper';
import UI from './UI';
import pkg from '../package.json';

Helper.vanity(
  `🦓 ${pkg.name}\nv${pkg.version}.${__webpack_hash__}\nwebpack.mode ${
    JSON.parse(process.env.DEBUGGING!) ? 'development' : 'production'
  }\nGSC caching ${
    /\?cache=/.test(
      (document.querySelector('script[src*="kb-"]') as HTMLScriptElement).src
    )
      ? 'disabled'
      : 'enabled'
  }`
);

Helper.require([
  `https://storage.googleapis.com/${
    process.env.BUCKET_NAME as string
  }/build/kb-${pkg.version}.css${
    process.env.DEBUGGING ? `?cache=${crypto.randomUUID()}` : ''
  }`
]);

Functionality();
UI();
Embed();

Helper.onLoad.activate();
