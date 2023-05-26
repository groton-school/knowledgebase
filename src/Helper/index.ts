import iframe from './iframe';
import log from './log';
import onGoogleDocEmbed from './onGoogleDocEmbed';
import * as onLoad from './onLoad';
import onSelectorReady from './onSelectorReady';
import libRequire from './require';

const Helper = {
  onLoad,
  onSelectorReady,
  onGoogleDocEmbed,
  log,
  iframe,
  require: libRequire
};
export default Helper;
