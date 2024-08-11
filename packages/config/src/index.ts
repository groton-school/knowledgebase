import _Config from './Config';
import _Groups from './Groups';
import _Index from './IndexFile';
import _Keys from './Keys';

namespace Config {
  export import Config = _Config;
  export type Groups = _Groups;
  export type Index = _Index;
  export type Keys = _Keys;
}

export default Config;
