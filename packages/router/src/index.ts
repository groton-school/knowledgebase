import CloudStorageRouter from './Handlers/CloudStorageRouter';
import Favicon from './Handlers/Favicon';
import Login from './Handlers/Login';
import Logout from './Handlers/Logout';
import Helper from './Helper';
import Session from './Middleware/Session';
import Auth from './Services/Auth';
import Logger from './Services/Logger';
import express from 'express';

(async () => {
  const [keys, config, groups, index] = await Helper.loadConfigFiles();

  Auth.init({ keys });

  const app = express();
  app.set('trust proxy', true); // https://stackoverflow.com/a/77331306/294171
  app.use(Session({ config }));

  app.get('/favicon.ico', Favicon());
  app.get('/logout', Logout());
  app.get(Auth.redirectUri.pathname, Login());

  // TODO destroy /_ah/* sessions

  // exclude GAE `/_ah/*` endpoints but process others matching `/*`
  // https://stackoverflow.com/a/53606500/294171
  app.get(/^(?!.*_ah).*$/, CloudStorageRouter({ config, index, groups }));

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    Logger.info(`HTTP server listening on port ${port}`);
  });
})();
