import * as Cookies from './Cookies';
import Stack from './Stack';
import iframe from './iframe';
import log from './log';
import onGoogleDocEmbed from './onGoogleDocEmbed';
import * as onLoad from './onLoad';
import onSelectorReady from './onSelectorReady';
import straightenCurlyQuotes from './straightenCurlyQuotes';
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
  vanity,
  straightenCurlyQuotes,
  Stack
};
export default Helper;
