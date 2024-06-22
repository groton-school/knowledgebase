import cli from '@battis/qui-cli';
import { Storage } from '@google-cloud/storage';
import Drive, { drive_v3 } from '@googleapis/drive';
import express from 'express';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import open from 'open';

export default class Client {
  private static oauth2: OAuth2Client | undefined = undefined;
  private static drive: Drive.drive_v3.Drive | undefined = undefined;
  private static storage: Storage | undefined = undefined;

  private static keysPath: string | undefined = undefined;
  private static tokensPath: string | undefined = undefined;

  private constructor() {}

  public static init({
    keysPath,
    tokensPath
  }: {
    keysPath: string;
    tokensPath: string;
  }) {
    this.keysPath = keysPath;
    this.tokensPath = tokensPath;
  }

  public static async getDrive() {
    if (!Client.drive) {
      Client.drive = Drive.drive({
        version: 'v3',
        auth: await Client.getOAuth2Client({
          scope: 'https://www.googleapis.com/auth/drive'
        })
      });
    }
    return this.drive as drive_v3.Drive;
  }

  public static getStorage() {
    if (!Client.storage) {
      Client.storage = new Storage();
    }
    return Client.storage;
  }

  public static async getOAuth2Client({
    scope
  }: {
    scope: string;
  }): Promise<OAuth2Client> {
    return new Promise(async (resolve, reject) => {
      if (!Client.keysPath || !Client.tokensPath) {
        throw new Error('Client not initialized');
      }
      if (!Client.oauth2) {
        const keys = JSON.parse(fs.readFileSync(Client.keysPath).toString());
        const redirectUri = new URL(
          keys.web.redirect_uris
            ? keys.web.redirect_uris
                .filter((uri: string) => uri.match(/^http:\/\/localhost/))
                .shift()!
            : await cli.prompts.input({ message: 'Redirect URI' })
        );
        Client.oauth2 = new OAuth2Client({
          clientId: keys.web.client_id,
          clientSecret: keys.web.client_secret,
          redirectUri: redirectUri.href
        });

        let tokens;
        if (fs.existsSync(Client.tokensPath)) {
          tokens = JSON.parse(fs.readFileSync(Client.tokensPath).toString());
        }
        if (tokens) {
          Client.oauth2.setCredentials(tokens);
          resolve(Client.oauth2);
          return;
        }

        const app = express();
        const server = app.listen(redirectUri.port);
        app.get('/favicon.ico', (_, response) => response.send());
        app.get('*', async (request, response): Promise<void> => {
          response.send('You may close this window.');
          server.close();
          if (request.path != redirectUri.pathname) {
            const error = `Path mismatch (expected '${redirectUri.pathname}', received '${request.path}'`;
            reject(error);
          }
          if (request.query.error) {
            const error = JSON.stringify(request.query);
            reject(error);
          }
          if (request.query.code) {
            const { tokens } = await Client.oauth2!.getToken(
              request.query.code.toString()
            );
            fs.writeFileSync(Client.tokensPath!, JSON.stringify(tokens));
            Client.oauth2!.setCredentials(tokens);
            resolve(Client.oauth2!);
          }
        });
        open(
          Client.oauth2.generateAuthUrl({
            access_type: 'offline',
            scope
          })
        );
      } else {
        resolve(Client.oauth2);
      }
    });
  }
}
