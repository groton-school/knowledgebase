import { UrlString, PathString } from '@groton/knowledgebase.strings';

type Config = {
  gae: { url: UrlString };
  session: { secret: string };
  storage: { bucket: string };
  kb: {
    root: PathString;
    search?: { include?: string[]; exclude?: string[] };
  };
};

export default Config;
