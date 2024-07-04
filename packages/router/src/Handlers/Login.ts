import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

export default function Login({ authClient }: { authClient: OAuth2Client }) {
  return async (req: Request, res: Response) => {
    if (req.query.code) {
      const tokenResponse = await authClient.getToken(
        req.query.code.toString()
      );
      req.session.tokens = { ...req.session.tokens, ...tokenResponse.tokens };

      // https://developers.google.com/identity/openid-connect/openid-connect#obtaininguserprofileinformation
      // TODO ...or just decode the id_token?
      req.session.userInfo = JSON.parse(
        atob(req.session.tokens.id_token?.split('.')[1] as string)
      );
      res.redirect(req.session.redirect || '/');
    } else {
      res.send('No code present');
    }
  };
}
