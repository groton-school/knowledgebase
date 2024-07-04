import Helper from '../Helper';
import { Var } from '../Helper/Var';
import Logger from '../Services/Logger';
import { Storage } from '@google-cloud/storage';
import File from '@groton/knowledgebase.indexer/src/File';
import Folder from '@groton/knowledgebase.indexer/src/Folder';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';

export default function CloudStorageRouter({
  config,
  index,
  authClient
}: {
  config: Var.Config;
  index: Var.Index;
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
          const bucket = new Storage({
            authClient,
            projectId: process.env.GOOGLE_CLOUD_PROJECT
          }).bucket(config.storage.bucket);
          const file = bucket.file(Helper.normalizePath(req.path));
          if ((await file.exists())[0]) {
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
          } else {
            const folder = index.find(
              (file) => `/${file.index.path}/` == req.path
            );
            if (folder) {
              res.send(
                index.filter((file) => file.parents?.includes(folder.id))
              );
            } else {
              res.status(404);
            }
          }
        } catch (error) {
          Logger.error(req.originalUrl, error);
          res.status((error as any).code || 418);
        }
      } else {
        req.session.redirect = req.url;
        res.redirect(
          authClient.generateAuthUrl({
            access_type: 'offline',
            scope:
              'https://www.googleapis.com/auth/devstorage.read_only openid profile email'
          })
        );
      }
    }
  };
}
