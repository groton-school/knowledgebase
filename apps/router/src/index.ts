import CloudStorageRouter from './Handlers/Factories/CloudStorageRouter';
import Search from './Handlers/Factories/Search';
import SiteTree from './Handlers/Factories/SiteTree';
import Favicon from './Handlers/Favicon';
import Helper from './Helper';
import Session from './Middleware/Session';
import Auth from './Services/Auth';
import Logger from './Services/Logger';
import API from '@groton/knowledgebase.api';
import express from 'express';

(async () => {
  const [keys, config, groups, index] = await Helper.loadConfigFiles();

  Auth.init({ keys });

  const app = express();
  app.set('trust proxy', true); // https://stackoverflow.com/a/77331306/294171
  app.use(Session({ config }));

  app.get('/', (_, res) => res.redirect(config.kb.root));
  app.get('/favicon.ico', Favicon);
  app.get('/logout', Auth.deauthorize);
  app.get(Auth.redirectUri.pathname, Auth.authorize);
  app.get(API.SiteTree.path, SiteTree({ config, groups, index }));
  app.get(API.Search.path, Search({ config, groups, index }));

  // TODO destroy /_ah/* sessions

  // exclude GAE `/_ah/*` endpoints but process others matching `/*`
  // https://stackoverflow.com/a/53606500/294171
  app.get(/^(?!.*_ah).*$/, CloudStorageRouter({ config, index, groups }));

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    Logger.info(`HTTP server listening on port ${port}`);
  });
})();
