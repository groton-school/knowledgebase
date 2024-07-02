import { LoggingWinston } from '@google-cloud/logging-winston';
import { Storage } from '@google-cloud/storage';
import cookieParser from 'cookie-parser';
import express from 'express';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keys = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../var/keys.json')).toString()
);
const config = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../var/config.json')).toString()
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
  let updatedTokens;

  authClient.on('token', (tokens) => {
    updatedTokens = tokens;
  });

  function normalizePath(requestPath) {
    if (requestPath.endsWith('/')) {
      requestPath = `${requestPath}index.html`;
    }
    return requestPath.substring(1);
  }

  const app = express();
  app.use(cookieParser());

  app.get('/favicon.ico', (_, res) => {
    res.redirect(301, '/assets/favicon.ico');
  });

  app.get('/logout', (_, res) => {
    res.clearCookie(TOKEN);
    res.clearCookie(REDIRECT);
    res.send('Logged out');
  });
  app.get(redirectURI.pathname, async (req, res) => {
    const redirect = req.cookies?.redirect || '/';
    res.clearCookie(REDIRECT);
    if (req.query.code) {
      const tokenResponse = await authClient.getToken(
        req.query.code.toString()
      );
      res.cookie(TOKEN, tokenResponse.tokens, {
        secure: true,
        httpOnly: true
      });
      res.redirect(redirect);
    } else {
      res.send('No code present');
    }
  });

  /*
   * exclude GAE `/_ah/*` endpoints but process others matching `/*`
   * https://stackoverflow.com/a/53606500/294171
   */
  app.get(/^(?!.*_ah).*$/, async (req, res) => {
    if (!req.path.endsWith('/') && !/.*\.[^\\]+$/i.test(req.path)) {
      res.redirect(`${req.path}/`);
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
          res.type(metadata.contentType || path.extname(req.path));
          const stream = file.createReadStream();
          stream.on('data', (data) => res.write(data));
          stream.on('error', (error) =>
            logger.error(file.cloudStorageURI.href, error)
          );
          if (updatedTokens) {
            res.cookie(TOKEN, updatedTokens);
            updatedTokens = undefined;
          }
          stream.on('end', () => res.end());
        } catch (error) {
          logger.error(req.originalUrl, error);
          res.status(error.code || 418);
        }
      } else {
        res.cookie(REDIRECT, req.url, { secure: true, httpOnly: true });
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
