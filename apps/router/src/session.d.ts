import OpenID from './OpenID';
import { Credentials } from 'google-auth-library';

// https://akoskm.com/how-to-use-express-session-with-custom-sessiondata-typescript
declare module 'express-session' {
  interface SessionData {
    redirect?: string;
    tokens: Credentials;
    userInfo?: OpenID.UserInfo;
    groups?: string[];
  }
}
