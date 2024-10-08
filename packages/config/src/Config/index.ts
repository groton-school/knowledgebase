import ACLType from './ACL';
import ConfigType from './Config';
import SessionType from './Session';
import StorageType from './Storage';
import UIType from './UI';
import createDefaultFunc from './createDefault';
import syncFunc from './sync';

interface Config extends ConfigType {}

namespace Config {
  export const sync = syncFunc;
  export const createDefault = createDefaultFunc;
  export type Session = SessionType;
  export type Storage = StorageType;
  export type ACL = ACLType;
  export type UI = UIType;
}

export default Config;
