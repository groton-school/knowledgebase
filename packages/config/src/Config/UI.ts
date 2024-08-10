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
  webpack?: {
    doNotResolve?: PathString[];
  };
  googleAnalytics?: {
    trackingId: string;
  };
};

export default UI;
