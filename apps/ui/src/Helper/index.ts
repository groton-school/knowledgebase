import Stack from './Stack';
import addScript from './addScript';
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
  onLoad,
  onSelectorReady,
  onGoogleDocEmbed,
  log,
  iframe,
  vanity,
  straightenCurlyQuotes,
  Stack,
  addScript
};
export default Helper;
