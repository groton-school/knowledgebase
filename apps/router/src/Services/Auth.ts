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

  public static init({ keys }: AuthConfig) {
    Auth._redirectURI = new URL(keys.web.redirect_uris[0]);
    Auth._authClient = new OAuth2Client(
      keys.web.client_id,
      keys.web.client_secret,
      Auth._redirectURI.href
    );
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
      Auth.authClient.on('tokens', (tokens: Credentials) => {
        req.session.tokens = tokens;
      });
      return true;
    }

    req.session.redirect = req.url;
    res.redirect(Auth.authUrl);
    return false;
  }

  public static get authUrl(): string {
    return Auth.authClient.generateAuthUrl({
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
