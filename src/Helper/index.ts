import * as Cookies from './Cookies';
import fontAwesome from './fontAwesome';
import iframe from './iframe';
import log from './log';
import onGoogleDocEmbed from './onGoogleDocEmbed';
import * as onLoad from './onLoad';
import onSelectorReady from './onSelectorReady';
import libRequire from './require';
import vanity from './vanity';

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
  vanity,
  require: libRequire
};
export default Helper;
