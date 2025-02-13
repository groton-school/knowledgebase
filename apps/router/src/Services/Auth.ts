import { Config, Keys } from '@groton/knowledgebase.config';
import { OpenID } from '@groton/knowledgebase.openid';
import { NextFunction, Request, Response } from 'express';
import { Credentials, OAuth2Client } from 'google-auth-library';
import { Logger } from './Logger.js';

/*
 * Noting for the security-conscious among us that, by using using Firestore
 * as the storage mechansim for express-sessions and then storing user tokens
 * in the session store... we _are_ storing the tokens encrypted at rest, per
 * the Firestore documentation.
 *
 * @see https://cloud.google.com/firestore/docs/server-side-encryption
 */

type AuthConfig = {
  keys: Keys;
  config: Config;
};

export class Auth {
  private static _redirectURI: URL;
  private static _authClient: OAuth2Client;

  public static get redirectUri(): URL {
    if (!Auth._redirectURI) {
      throw new Error('Auth.redirectURI not initialized');
    }
    return Auth._redirectURI;
  }

  public static get authClient(): OAuth2Client {
    if (!Auth._authClient) {
      throw new Error('Auth.authClient not initialized');
    }
    return Auth._authClient;
  }

  public static init({ keys, config }: AuthConfig) {
    const preferredRedirect =
      keys.web.redirect_uris.find(
        (uri) => new URL(uri).hostname == config.hostname
      ) || keys.web.redirect_uris[0];
    Auth._redirectURI = new URL(preferredRedirect);
    Auth._authClient = new OAuth2Client(
      keys.web.client_id,
      keys.web.client_secret,
      Auth._redirectURI.href
    );

    // TODO there's probably a reasonable upper limit, but that would involve projecting how many simultaneous connections might be made to the router... and I'm not up for figuring that out
    Auth._authClient.setMaxListeners(Infinity);
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
      const tokenResponse = await Auth.authClient.getToken(
        req.query.code.toString()
      );
      req.session.userInfo = Auth.parseUserInfo(tokenResponse.tokens);
      req.session.tokens = tokenResponse.tokens;
      res.redirect(req.session.redirect || '/');
    }

    if (req.session.tokens) {
      Auth.authClient.setCredentials(req.session.tokens);
      const tokenListener = (tokens: Credentials) => {
        req.session.tokens = tokens;
        Auth.authClient.removeListener('tokens', tokenListener);
      };
      Auth.authClient.on('tokens', tokenListener);
      return true;
    }

    req.session.redirect = req.url.replace(`https://${req.hostname}`, '');
    res.redirect(Auth.authUrl);
    return false;
  }

  public static refreshToken(req: Request, res: Response, next: NextFunction) {
    if (
      req.session.tokens?.expiry_date &&
      req.session.tokens?.expiry_date < Date.now()
    ) {
      req.session.redirect = req.url.replace(`https://${req.hostname}`, '');
      res.redirect(Auth.authUrl);
    } else {
      next();
    }
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
    return Auth.authClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        // TODO examine these scopes more carefully
        'https://www.googleapis.com/auth/devstorage.read_only',
        'openid',
        'profile',
        'email'
      ]
    });
  }
}
