import { PathString } from '@groton/knowledgebase.strings';

type UI = {
  root?: PathString;
  search?: { include?: PathString[]; exclude?: PathString[] };
  site?: {
    logo?: PathString;
    favicon?: PathString;
    background?: PathString;
    navbarColor?: string;
    js?: PathString;
    css?: PathString;
  };
  directory?: {
    thumbnails?: {
      root: PathString;
      default?: PathString;
    };
  };
  webpack?: {
    doNotResolve?: PathString[];
  };
};

export default UI;
