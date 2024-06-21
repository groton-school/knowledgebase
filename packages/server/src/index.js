import { LoggingWinston } from '@google-cloud/logging-winston';
import { Storage } from '@google-cloud/storage';
import cookieParser from 'cookie-parser';
import express from 'express';
import fs from 'fs/promises';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keys = JSON.parse(
  await fs.readFile(path.resolve(__dirname, '../var/keys.json'))
);
const config = JSON.parse(
  await fs.readFile(path.resolve(__dirname, '../var/config.json'))
);

const TOKEN = 'token';
const REDIRECT = 'redirect';

(async () => {
  const logger = winston.createLogger({
    level: 'info',
    transports: [new LoggingWinston()]
  });
  const redirectURI = new URL(keys.web.redirect_uris[0]);
  const authClient = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    redirectURI.href
  );

  function normalizePath(requestPath) {
    if (requestPath.endsWith('/')) {
      requestPath = `${requestPath}index.html`;
    }
    return requestPath.substr(1);
  }

  async function mapToCloudStorage(req, res) {
    if (!req.path.endsWith('/') && !/.*\.[^\\]+$/i.test(req.path)) {
      res.redirect(`${req.path}/`).end();
    } else {
      if (req.cookies?.token) {
        authClient.setCredentials(req.cookies.token);
        try {
          const file = new Storage({
            authClient,
            projectId: process.env.GOOGLE_CLOUD_PROJECT
          })
            .bucket(config.storage.bucket)
            .file(normalizePath(req.path));
          const metadata = (await file.getMetadata())[0];
          res.type(metadata.contentType);
          res.send((await file.download()).toString()).end();
        } catch (error) {
          logger.error(req.originalUrl, error);
          res.status(error.code).end();
        }
      } else {
        res.cookie(REDIRECT, req.url, { secure: true, httpOnly: true });
        res
          .redirect(
            authClient.generateAuthUrl({
              access_type: 'offline',
              scope: 'https://www.googleapis.com/auth/devstorage.read_only'
            })
          )
          .end();
      }
    }
  }
  async function handleOAuth2Redirect(req, res) {
    const redirect = req.cookies?.redirect || '/';
    res.clearCookie(REDIRECT);
    const tokenResponse = await authClient.getToken(req.query.code.toString());
    res.cookie(TOKEN, tokenResponse.tokens, {
      secure: true,
      httpOnly: true
    });
    res.redirect(redirect);
    res.end();
  }

  function deauthorize(_, res) {
    res.clearCookie(TOKEN);
    res.clearCookie(REDIRECT);
    res.statusMessage = 'Logged out';
    res.status(200).end();
  }

  const app = express();
  app.use(cookieParser());
  app.get('/favicon.ico', (_, res) => {
    res.redirect(301, '/assets/favicon.ico').end();
  });
  app.get('/logout', deauthorize);
  app.get(redirectURI.pathname, handleOAuth2Redirect);

  /*
   * exclude GAE `/_ah/*` endpoints but process others matching `/*`
   * https://stackoverflow.com/a/53606500/294171
   */
  app.get(/^(?!.*_ah).*$/, mapToCloudStorage);

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });
})();
