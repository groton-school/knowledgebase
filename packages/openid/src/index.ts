import { EmailString, UrlString } from '@groton/knowledgebase.domain';

namespace OpenID {
  // TODO surely this is defined somewhere in the Google clients?
  export interface UserInfo {
    email?: EmailString;
    email_verified?: boolean;
    name?: string;
    picture?: UrlString;
    given_name?: string;
    family_name?: string;
  }
}

export default OpenID;
