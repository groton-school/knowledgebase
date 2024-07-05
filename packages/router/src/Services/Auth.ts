import { Var } from '../var';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

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

  public static authorize(req: Request, res: Response) {
    if (req.session.tokens) {
      Auth.authClient.setCredentials(req.session.tokens);
      Auth.authClient.on('tokens', (tokens) => {
        req.session.tokens = {
          ...req.session.tokens,
          ...tokens
        };
      });
      return true;
    } else {
      req.session.redirect = req.url;
      res.redirect(Auth.authUrl);
      return false;
    }
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
