import * as API from '@groton/knowledgebase.api';
import express from 'express';
import * as Handlers from './Handlers/index.js';
import * as Helper from './Helper/index.js';
import * as Middleware from './Middleware/index.js';
import * as Services from './Services/index.js';

(async () => {
  const [keys, config, groups, index] = await Helper.loadConfigFiles();

  Services.Auth.init({ keys, config });

  const app = express();
  app.set('trust proxy', true); // https://stackoverflow.com/a/77331306/294171
  app.use(Middleware.Session({ config }));

  app.get('/logout', Services.Auth.deauthorize);
  app.get(Services.Auth.redirectUri.pathname, (req, res) => {
    Services.Auth.authorize(req, res);
  });
  app.get('*', Services.Auth.refreshToken);
  app.get('/', (_, res, next) => {
    if (config.ui?.root) {
      res.redirect(config.ui.root);
    } else {
      next();
    }
  });
  app.get('/favicon.ico', Handlers.Favicon);
  app.get(
    API.SiteTree.path,
    Handlers.Factories.SiteTree({ config, groups, index })
  );
  app.get(
    API.Search.path,
    Handlers.Factories.Search({ config, groups, index })
  );

  // TODO destroy /_ah/* sessions

  // exclude GAE `/_ah/*` endpoints but process others matching `/*`
  // https://stackoverflow.com/a/53606500/294171
  app.get(
    /^(?!.*_ah).*$/,
    Handlers.Factories.CloudStorageRouter({ config, index, groups })
  );

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    Services.Logger.info(`HTTP server listening on port ${port}`);
  });
})();
