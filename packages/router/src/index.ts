import CloudStorageRouter from './Handlers/CloudStorageRouter';
import Login from './Handlers/Login';
import Logout from './Handlers/Logout';
import Session from './Middleware/Session';
import Logger from './Services/Logger';
import express from 'express';
import fs from 'fs/promises';
import { OAuth2Client, Credentials } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';

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

  const app = express();
  app.set('trust proxy', true); // https://stackoverflow.com/a/77331306/294171
  app.use(Session({ config }));

  app.get('/favicon.ico', (_, res) => {
    res.redirect(301, '/assets/favicon.ico');
  });

  app.get('/logout', Logout());

  app.get(redirectURI.pathname, Login({ authClient }));

  /*
   * exclude GAE `/_ah/*` endpoints but process others matching `/*`
   * https://stackoverflow.com/a/53606500/294171
   */
  app.get(/^(?!.*_ah).*$/, CloudStorageRouter({ config, index, authClient }));

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    Logger.info(`HTTP server listening on port ${port}`);
  });
})();
