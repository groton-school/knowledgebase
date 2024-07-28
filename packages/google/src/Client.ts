import cli from '@battis/qui-cli';
import { Storage } from '@google-cloud/storage';
import Drive from '@googleapis/drive';
import express from 'express';
import fs from 'fs';
import { OAuth2Client, Credentials } from 'google-auth-library';
import open from 'open';

export default class Client {
  private static oauth2?: OAuth2Client;
  private static drive?: Drive.drive_v3.Drive;
  private static storage?: Storage;

  private static keysPath?: string;
  private static tokensPath?: string;

  protected constructor() {}

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
    if (!this.drive) {
      this.drive = Drive.drive({
        version: 'v3',
        auth: await this.getOAuth2Client({
          scope: 'https://www.googleapis.com/auth/drive'
        })
      });
    }
    return this.drive;
  }

  public static getStorage() {
    if (!this.storage) {
      this.storage = new Storage();
    }
    return this.storage;
  }

  public static async getOAuth2Client({
    scope
  }: {
    scope: string;
  }): Promise<OAuth2Client> {
    return new Promise(async (resolve, reject) => {
      if (!this.keysPath || !this.tokensPath) {
        throw new Error('Client not initialized');
      }
      if (!this.oauth2) {
        const keys = JSON.parse(fs.readFileSync(this.keysPath).toString());
        const redirectUri = new URL(
          keys.web.redirect_uris
            ? keys.web.redirect_uris
                .filter((uri: string) => uri.match(/^http:\/\/localhost/))
                .shift()!
            : await cli.prompts.input({ message: 'Redirect URI' })
        );
        const oauth2 = new OAuth2Client({
          clientId: keys.web.client_id,
          clientSecret: keys.web.client_secret,
          redirectUri: redirectUri.href
        });

        let tokens: Credentials | undefined;
        if (fs.existsSync(this.tokensPath)) {
          tokens = JSON.parse(fs.readFileSync(this.tokensPath).toString());
        }
        if (tokens) {
          oauth2.setCredentials(tokens);
          resolve((this.oauth2 = oauth2));
          return;
        }

        const app = express();
        const server = app.listen(redirectUri.port);
        app.get('/favicon.ico', (_, res) => res.send());
        app.get('*', async (req, res): Promise<void> => {
          if (req.path != redirectUri.pathname) {
            const error = `Path mismatch (expected '${redirectUri.pathname}', received '${req.path}'`;
            reject(error);
          }
          if (req.query.error) {
            const error = JSON.stringify(req.query);
            reject(error);
          }
          if (req.query.code) {
            const { tokens } = await this.oauth2!.getToken(
              req.query.code.toString()
            );
            fs.writeFileSync(this.tokensPath!, JSON.stringify(tokens));
            oauth2.setCredentials(tokens);
            resolve((this.oauth2 = oauth2));
          }
          res.send('You may close this window.');
          server.close();
        });
        open(
          oauth2.generateAuthUrl({
            access_type: 'offline',
            scope
          })
        );
      } else {
        resolve(this.oauth2);
      }
    });
  }
}
