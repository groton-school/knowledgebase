import { HostnameString } from '@groton/knowledgebase.domain';
import ACL from './ACL';
import Session from './Session';
import Storage from './Storage';
import UI from './UI';

type Config = {
  hostname?: HostnameString;
  session: Session;
  storage: Storage;
  acl?: ACL;
  ui?: UI;
};

export default Config;
