import { PathString } from '@groton/knowledgebase.strings';

type UI = {
  root?: PathString;
  search?: { include?: string[]; exclude?: string[] };
  site?: {
    logo?: PathString;
    favicon?: PathString;
    js?: PathString;
    css?: PathString;
  };
  directory?: {
    thumbnails?: {
      root: PathString;
      default?: PathString;
      indexable?: boolean;
    };
  };
};

export default UI;
