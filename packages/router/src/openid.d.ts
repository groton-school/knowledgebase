declare namespace OpenID {
  // TODO surely this is defined somewhere in the Google clients?
  interface UserInfo {
    email?: EmailString;
    email_verified?: boolean;
    name?: string;
    picture?: UrlString;
    given_name?: string;
    family_name?: string;
  }
}
