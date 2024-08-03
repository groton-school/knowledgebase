import UI from './UI';
import { HostnameString } from '@groton/knowledgebase.strings';

type Config = {
  hostname?: HostnameString;
  session: { secret: string };
  storage: { bucket: string };
  ui?: UI;
};

export default Config;
