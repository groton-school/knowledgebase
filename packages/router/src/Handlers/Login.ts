import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';

export default function Login({ authClient }: { authClient: OAuth2Client }) {
  return async (req: Request, res: Response) => {
    if (req.query.code) {
      const tokenResponse = await authClient.getToken(
        req.query.code.toString()
      );
      req.session.tokens = { ...req.session.tokens, ...tokenResponse.tokens };
      res.redirect(req.session.redirect || '/');
    } else {
      res.send('No code present');
    }
  };
}
