import Helper from '../Helper';
import { Var } from '../Helper/Var';
import Logger from '../Services/Logger';
import { Storage } from '@google-cloud/storage';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';

export default function CloudStorageRouter({
  config,
  index,
  groups,
  authClient
}: {
  config: Var.Config;
  index: Var.Index;
  groups: Var.Groups;
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
            if (!req.session.groups) {
              const userGroups: string[] = [];
              for (const group of groups) {
                try {
                  if (
                    (
                      await (
                        await fetch(
                          `https://cloudidentity.googleapis.com/v1/${group.name}/memberships:checkTransitiveMembership?query=member_key_id == '${req.session.userInfo.email}'`,
                          {
                            headers: {
                              Authorization: `Bearer ${req.session.tokens?.access_token}`
                            }
                          }
                        )
                      ).json()
                    ).hasMembership
                  ) {
                    userGroups.push(group.groupKey.id);
                  }
                } catch (_) {
                  // ignore error
                }
              }
              req.session.groups = userGroups;
            }
            const folder = index.find(
              (file) =>
                `/${file.index.path}/` == req.path &&
                file.permissions?.reduce((access: boolean, permission) => {
                  if (req.session.groups.includes(permission.emailAddress)) {
                    return true;
                  }
                  return access;
                }, false)
            );
            if (folder) {
              const pages = index.filter(
                (file) =>
                  file.parents?.includes(folder.id) &&
                  file.permissions?.reduce((access: boolean, permission) => {
                    if (req.session.groups.includes(permission.emailAddress)) {
                      return true;
                    }
                    return access;
                  }, false)
              );
              res.send(`<!doctype html>
                  <html lang="en">
                  <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta content="text/html; charset=UTF-8" http-equiv="content-type">
                <meta item-prop="kb.id" content="${folder.id}">
                  <title>${folder.name}</title>
                  <link rel="icon" href="/assets/favicon.ico">
                  <link rel="stylesheet" href="/assets/kb.css" />
                  </head>
                  <body>
                  <div id="directory">
                  <h1>${folder.name}</h1>
                  ${pages
                    .map(
                      (page) =>
                        `<div class="page"><a href="/${
                          // TODO this path formatting is wonky
                          page.index.path
                        }/"><h2 class="title">${page.name}</h2>${
                          page.description
                            ? `<div class="description">${page.description}</div>`
                            : ''
                        }</a></div>`
                    )
                    .join('')}
                  </div>
                  <script src="/assets/kb.js"></script>
                  </body>
                  `);
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
            // TODO examine these scopes more carefully
            scope:
              'https://www.googleapis.com/auth/devstorage.read_only openid profile email https://www.googleapis.com/auth/cloud-identity.groups.readonly'
          })
        );
      }
    }
  };
}
