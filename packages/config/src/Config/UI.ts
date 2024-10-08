import { CSSColorString, PathString } from '@groton/knowledgebase.domain';

type UI = {
  root?: PathString;
  search?: { include?: PathString[]; exclude?: PathString[] };
  site?: {
    logo?: PathString;
    favicon?: PathString;
    background?: PathString;
    primaryColor?: CSSColorString;
    dark?: boolean;
    darkSearchForm?: boolean;
    js?: PathString;
    css?: PathString;
  };
  directory?: {
    thumbnails?: {
      root: PathString;
      default?: PathString;
      directory?: PathString;
    };
  };
  webpack?: {
    doNotResolve?: PathString[];
  };
  googleAnalytics?: {
    trackingId: string;
  };
};

export default UI;
