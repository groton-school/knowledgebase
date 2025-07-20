import { EmailString, URLString } from '@battis/descriptive-types';

// TODO surely this is defined somewhere in the Google clients?
export interface UserInfo {
  email?: EmailString;
  email_verified?: boolean;
  name?: string;
  picture?: URLString;
  given_name?: string;
  family_name?: string;
}
