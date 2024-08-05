import { PathString, CSSColorString } from '@groton/knowledgebase.strings';

type UI = {
  root?: PathString;
  search?: { include?: PathString[]; exclude?: PathString[] };
  site?: {
    logo?: PathString;
    favicon?: PathString;
    background?: PathString;
    primaryColor?: CSSColorString;
    js?: PathString;
    css?: PathString;
  };
  directory?: {
    thumbnails?: {
      root: PathString;
      default?: PathString;
    };
  };
  toc?: {
    maxDepth?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  webpack?: {
    doNotResolve?: PathString[];
  };
};

export default UI;
