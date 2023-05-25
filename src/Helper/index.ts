import fontAwesome from './fontAwesome';
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
  fontAwesome,
  require: libRequire,
  googleDocEmbed: 'googleDocEmbed'
};
export default Helper;
