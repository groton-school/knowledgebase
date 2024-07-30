import { HostnameString, PathString } from '@groton/knowledgebase.strings';

type Config = {
  hostname?: HostnameString;
  session: { secret: string };
  storage: { bucket: string };
  kb: {
    root: PathString;
    search?: { include?: string[]; exclude?: string[] };
  };
};

export default Config;
