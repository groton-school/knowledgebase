import { Var } from '../Helper/Var';
import { FirestoreStore } from '@google-cloud/connect-firestore';
import { Firestore } from '@google-cloud/firestore';
import session from 'express-session';
import { Credentials } from 'google-auth-library';

declare namespace Express {
  export interface Session {
    redirect?: string;
    tokens?: Credentials;
    userInfo?: Record<string, any>;
  }
}

export default function Session({ config }: { config: Var.Config }) {
  return session({
    secret: config.session.secret, // if using cookies, use same secret!
    cookie: { secure: true, maxAge: 90 * 24 * 60 * 60 * 1000 },
    store: new FirestoreStore({
      dataset: new Firestore(),
      kind: 'express-sessions'
    }),
    resave: true,
    rolling: true
  });
}
