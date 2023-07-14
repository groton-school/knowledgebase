import * as Cookies from './Cookies';
import fontAwesome from './fontAwesome';
import iframe from './iframe';
import log from './log';
import onGoogleDocEmbed from './onGoogleDocEmbed';
import * as onLoad from './onLoad';
import onSelectorReady from './onSelectorReady';
import libRequire from './require';

/**
 * Helper functions used across all plugins
 */
const Helper = {
  Cookies,
  onLoad,
  onSelectorReady,
  onGoogleDocEmbed,
  log,
  iframe,
  fontAwesome,
  require: libRequire
};
export default Helper;
