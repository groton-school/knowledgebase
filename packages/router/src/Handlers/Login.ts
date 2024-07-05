import Auth from '../Services/Auth';
import HandlerFactory from './HandlerFactory';

const Login: HandlerFactory = () => {
  return async (req, res) => {
    if (req.query.code) {
      const tokenResponse = await Auth.authClient.getToken(
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
      res.status(401);
      res.send('Missing authorization code');
    }
  };
};

export default Login;
