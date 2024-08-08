import ACL from '../../Services/ACL';
import Auth from '../../Services/Auth';
import Logger from '../../Services/Logger';
import HandlerFactory from './HandlerFactory';
import { Storage } from '@google-cloud/storage';
import path from 'path';

const CloudStorageRouter: HandlerFactory = ({ config, index, groups } = {}) => {
  // TODO better way to do this?
  if (!config || !index || !groups) {
    throw new Error(
      `Missing CloudStorageRouter configuration: ${JSON.stringify({
        config: !!config,
        index: !!index,
        groups: !!groups
      })}`
    );
  }
  return async (req, res) => {
    try {
      if (await Auth.authorize(req, res)) {
        const bucket = new Storage({
          authClient: Auth.authClient,
          projectId: process.env.GOOGLE_CLOUD_PROJECT
        }).bucket(config.storage.bucket);

        let reqPath = path.join(
          req.path.substring(1),
          /\.\w+$/.test(req.path) ? '' : 'index.html'
        );
        const acl = await new ACL(req, res, groups).prepare();
        const gsPath = `gs://${config.storage.bucket}/${reqPath}`;
        const reqFile = index.find(
          (f) => f.index.uri.includes(gsPath) && acl.hasAccess(f.permissions)
        );
        let success = false;

        if (reqFile) {
          const file = bucket.file(reqPath);
          const metadata = (await file.getMetadata())[0];
          res.type(metadata.contentType || path.extname(reqPath));
          const stream = file.createReadStream();
          stream.on('data', (data) => res.write(data));
          stream.on('error', (error) =>
            Logger.error(file.cloudStorageURI.href, error)
          );
          stream.on('end', () => res.end());
          success = true;
        } else {
          reqPath = req.path.replace(/^\/(.+[^\/])\/?$/, '$1');
          const requestedDir = index.find(
            (f) => f.index.path == reqPath && acl.hasAccess(f.permissions)
          );
          if (requestedDir) {
            const pages = index
              .filter(
                (file) =>
                  !file.index.hidden &&
                  file.parents?.includes(requestedDir.id) &&
                  acl.hasAccess(file.permissions)
              )
              .sort((a, b) => a.name.localeCompare(b.name));
            // TODO template
            res.send(`<!doctype html>
                    <html lang="en">
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <meta content="text/html; charset=UTF-8" http-equiv="content-type">
                      <meta item-prop="kb.id" content="${requestedDir.id}">
                      <title>${requestedDir.name}</title>${
              config.ui?.site?.favicon
                ? `
                      <link rel="icon" href="${config.ui.site.favicon}">`
                : ''
            }${
              config.ui?.site?.css
                ? `
                      <link rel="stylesheet" href="${config.ui.site.css}" />`
                : ''
            }
                    </head>
                    <body>
                    <div id="directory">
                    <h1 class="title">${requestedDir.name}</h1>
                    ${pages
                      .map(
                        (page) =>
                          `<div class="page">
                            <div class="name"><a href="/${
                              // TODO this path formatting is wonky
                              page.index.path
                            }/">${page.name}</a></div>${
                            page.description
                              ? `<div class="description">${page.description}</div>`
                              : ''
                          }</div>`
                      )
                      .join('')}
                    </div>${
                      config.ui?.site?.js
                        ? `
                      <script src="${config.ui.site.js}"></script>`
                        : ''
                    }
                    </body>
                    `);
            success = true;
          }
        }
        if (!success) {
          res.send(404);
        }
      }
    } catch (error) {
      if (error == 'Error: No refresh token is set.') {
        // silent login if refresh token not present
        // TODO this should be caught/handled in Auth.authorize, not here
        req.session.redirect = req.url.replace(`https://${req.host}`, '');
        res.redirect(Auth.authUrl);
      } else {
        Logger.error(req.originalUrl, {
          function: 'CloudStorageRouter',
          error
        });
        res.status((error as any).code || 500);
      }
    }
  };
};

export default CloudStorageRouter;
