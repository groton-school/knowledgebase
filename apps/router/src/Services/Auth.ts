import Logger from './Logger';
import Var from '@groton/knowledgebase.config';
import OpenID from '@groton/knowledgebase.openid';
import { Request, Response } from 'express';
import { OAuth2Client, Credentials } from 'google-auth-library';

/*
 * Noting for the security-conscious among us that, by using using Firestore
 * as the storage mechansim for express-sessions and then storing user tokens
 * in the session store... we _are_ storing the tokens encrypted at rest, per
 * the Firestore documentation.
 *
 * @see https://cloud.google.com/firestore/docs/server-side-encryption
 */

type AuthConfig = {
  keys: Var.Keys;
};

export default class Auth {
  private static _redirectURI: URL;
  private static _authClient: OAuth2Client;

  public static get redirectUri(): URL {
    if (!this._redirectURI) {
      throw new Error('Auth.redirectURI not initialized');
    }
    return this._redirectURI;
  }

  public static get authClient(): OAuth2Client {
    if (!this._authClient) {
      throw new Error('Auth.authClient not initialized');
    }
    return this._authClient;
  }

  public static init({ keys }: AuthConfig) {
    this._redirectURI = new URL(keys.web.redirect_uris[0]);
    this._authClient = new OAuth2Client(
      keys.web.client_id,
      keys.web.client_secret,
      this._redirectURI.href
    );

    // TODO there's probably a reasonable upper limit, but that would involve projecting how many simultaneous connections might be made to the router... and I'm not up for figuring that out
    this._authClient.setMaxListeners(Infinity);
  }

  /**
   * @see https://developers.google.com/identity/openid-connect/openid-connect#obtaininguserprofileinformation
   *
   * TODO ...or just decode the id_token?
   */
  private static parseUserInfo(tokenResponse: Credentials): OpenID.UserInfo {
    return JSON.parse(atob(tokenResponse.id_token?.split('.')[1] as string));
  }

  public static async authorize(req: Request, res: Response) {
    if (req.query.code) {
      const tokenResponse = await this.authClient.getToken(
        req.query.code.toString()
      );
      req.session.userInfo = this.parseUserInfo(tokenResponse.tokens);
      req.session.tokens = tokenResponse.tokens;
      res.redirect(req.session.redirect || '/');
    }

    if (req.session.tokens) {
      this.authClient.setCredentials(req.session.tokens);
      const tokenListener = (tokens: Credentials) => {
        req.session.tokens = tokens;
        this.authClient.removeListener('tokens', tokenListener);
      };
      this.authClient.on('tokens', tokenListener);
      return true;
    }

    req.session.redirect = req.url;
    res.redirect(this.authUrl);
    return false;
  }

  public static deauthorize(req: Request, res: Response) {
    req.session.destroy((error) => {
      if (error) {
        Logger.error(req.originalUrl, {
          function: 'Auth.deauthorize()',
          error
        });
        res.status(error.code || 500);
        res.send('Error logging out');
      } else {
        res.send('Logged out');
      }
    });
  }

  public static get authUrl(): string {
    return this.authClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        // TODO examine these scopes more carefully
        'https://www.googleapis.com/auth/devstorage.read_only',
        'https://www.googleapis.com/auth/cloud-identity.groups.readonly',
        'openid',
        'profile',
        'email'
      ]
    });
  }
}
