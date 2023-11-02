import * as Cookies from './Cookies';
import fontAwesome from './fontAwesome';
import iframe from './iframe';
import log from './log';
import onGoogleDocEmbed from './onGoogleDocEmbed';
import * as onLoad from './onLoad';
import onSelectorReady from './onSelectorReady';
import libRequire from './require';
import vanity from './vanity';
import straightenCurlyQuotes from './straightenCurlyQuotes';
import Stack from './Stack';

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
  straightenCurlyQuotes,
  require: libRequire,
  Stack
};
export default Helper;
