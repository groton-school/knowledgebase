import { FirestoreStore } from '@google-cloud/connect-firestore';
import { Firestore } from '@google-cloud/firestore';
import { Config } from '@groton/knowledgebase.config';
import session from 'express-session';

type SessionConfig = {
  config: Config.Config;
};

export function Session({
  config: {
    session: { secret }
  }
}: SessionConfig): ReturnType<typeof session> {
  return session({
    secret, // if using cookies, use same secret!
    cookie: { secure: true, maxAge: 90 * 24 * 60 * 60 * 1000 },
    store: new FirestoreStore({
      dataset: new Firestore(),
      kind: 'express-sessions'
    }),
    resave: true,
    rolling: true
  });
}
