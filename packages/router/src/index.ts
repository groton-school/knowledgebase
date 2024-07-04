import { FirestoreStore } from '@google-cloud/connect-firestore';
import { Firestore } from '@google-cloud/firestore';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { Storage } from '@google-cloud/storage';
import express from 'express';
import session from 'express-session';
import fs from 'fs/promises';
import { GoogleAuth, OAuth2Client, Credentials } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

// https://akoskm.com/how-to-use-express-session-with-custom-sessiondata-typescript
declare module 'express-session' {
  interface SessionData {
    redirect: string;
    tokens: Credentials;
    id_token: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const logger = winston.createLogger({
    level: 'info',
    transports: [new LoggingWinston()]
  });

  const [keys, config, groups, index] = (
    await Promise.all([
      fs.readFile(path.resolve(__dirname, '../var/keys.json')),
      fs.readFile(path.resolve(__dirname, '../var/config.json')),
      fs.readFile(path.resolve(__dirname, '../var/groups.json')),
      fs.readFile(path.resolve(__dirname, '../var/index.json'))
    ])
  ).map((response) => JSON.parse(response.toString()));

  const redirectURI = new URL(keys.web.redirect_uris[0]);
  const authClient = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    redirectURI.href
  );

  function normalizePath(requestPath: string) {
    if (requestPath.endsWith('/')) {
      requestPath = `${requestPath}index.html`;
    }
    return requestPath.substring(1);
  }

  const app = express();
  app.set('trust proxy', true); // https://stackoverflow.com/a/77331306/294171
  app.use(
    session({
      secret: config.session.secret, // if using cookies, use same secret!
      cookie: { secure: true, maxAge: 90 * 24 * 60 * 60 * 1000 },
      store: new FirestoreStore({
        dataset: new Firestore(),
        kind: 'express-sessions'
      }),
      resave: true,
      rolling: true
    })
  );

  app.get('/favicon.ico', (_, res) => {
    res.redirect(301, '/assets/favicon.ico');
  });

  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        logger.error(JSON.stringify(err));
      }
      res.send('Logged out');
    });
  });

  app.get(redirectURI.pathname, async (req, res) => {
    if (req.query.code) {
      const tokenResponse = await authClient.getToken(
        req.query.code.toString()
      );
      req.session.tokens = { ...req.session.tokens, ...tokenResponse.tokens };

      const auth = new GoogleAuth();
      const client = await auth.getIdTokenClient(config.gae.url);
      req.session.id_token = await client.idTokenProvider.fetchIdToken(
        config.gae.url
      );
      res.redirect(req.session.redirect || '/');
    } else {
      res.send('No code present');
    }
  });

  /*
   * exclude GAE `/_ah/*` endpoints but process others matching `/*`
   * https://stackoverflow.com/a/53606500/294171
   */
  app.get(/^(?!.*_ah).*$/, async (req, res): Promise<any> => {
    req.session.redirect = undefined;
    if (!req.path.endsWith('/') && !/.*\.[^\\]+$/i.test(req.path)) {
      res.redirect(`${req.path}/`);
    } else {
      if (req.session.tokens) {
        authClient.setCredentials(req.session.tokens);
        try {
          const file = new Storage({
            authClient,
            projectId: process.env.GOOGLE_CLOUD_PROJECT
          })
            .bucket(config.storage.bucket)
            .file(normalizePath(req.path));
          const metadata = (await file.getMetadata())[0];
          res.type(metadata.contentType || path.extname(req.path));
          const stream = file.createReadStream();
          stream.on('data', (data) => res.write(data));
          stream.on('error', (error) =>
            logger.error(file.cloudStorageURI.href, error)
          );
          req.session.tokens = {
            ...req.session.tokens,
            ...authClient.credentials
          };
          stream.on('end', () => res.end());
        } catch (error) {
          logger.error(req.originalUrl, error);
          res.status((error as any).code || 418);
        }
      } else {
        req.session.redirect = req.url;
        res.redirect(
          authClient.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/devstorage.read_only'
          })
        );
      }
    }
  });

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });
})();
