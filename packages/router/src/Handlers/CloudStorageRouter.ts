import Helper from '../Helper';
import { Var } from '../Helper/Var';
import Logger from '../Services/Logger';
import { Storage } from '@google-cloud/storage';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';

export default function CloudStorageRouter({
  config,
  authClient
}: {
  config: Var.Config;
  authClient: OAuth2Client;
}) {
  return async (req: Request, res: Response) => {
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
            .file(Helper.normalizePath(req.path));
          const metadata = (await file.getMetadata())[0];
          res.type(metadata.contentType || path.extname(req.path));
          const stream = file.createReadStream();
          stream.on('data', (data) => res.write(data));
          stream.on('error', (error) =>
            Logger.error(file.cloudStorageURI.href, error)
          );
          req.session.tokens = {
            ...req.session.tokens,
            ...authClient.credentials
          };
          stream.on('end', () => res.end());
        } catch (error) {
          Logger.error(req.originalUrl, error);
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
  };
}
