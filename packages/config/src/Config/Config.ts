import { HostnameString } from '@groton/knowledgebase.domain';
import ACL from './ACL.js';
import Session from './Session.js';
import Storage from './Storage.js';
import UI from './UI.js';

export type Config = {
  hostname?: HostnameString;
  session: Session;
  storage: Storage;
  acl?: ACL;
  ui?: UI;
};
