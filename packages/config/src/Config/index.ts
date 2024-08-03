import ConfigType from './Config';
import UIType from './UI';
import createDefaultFunc from './createDefault';
import syncFunc from './sync';

interface Config extends ConfigType {}

namespace Config {
  export const sync = syncFunc;
  export const createDefault = createDefaultFunc;
  export type UI = UIType;
}

export default Config;
