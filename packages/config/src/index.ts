import ConfigModule from './Config';
import GroupsType from './Groups';
import IndexType from './IndexFile';
import KeysType from './Keys';

namespace Config {
  export import Config = ConfigModule;
  export type Groups = GroupsType;
  export type Index = IndexType;
  export type Keys = KeysType;
}

export default Config;
