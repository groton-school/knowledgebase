const express = require('express');
const cookieParser = require('cookie-parser');
const google = require('google-auth-library');

const credentials = require('../credentials.json');

(async () => {
  const redirectURI = credentials.web.redirect_uris[0];
  const client = new google.OAuth2Client(
    credentials.web.client_id,
    credentials.web.client_secret,
    redirectURI
  );

  const app = express();
  app.use(cookieParser());

  app.get('/logout', (_, res) => {
    res.clearCookie('token');
    res.send('logged out');
    res.end();
  });
  app.get(redirectURI, async (req, res) => {
    const redirect = req.cookies?.redirect || '/';
    res.clearCookie('redirect');
    res.cookie('token', await client.getToken(req.cookies.code), {
      secure: true
    });
    res.redirect(redirect);
    res.end();
  });
  app.get('/*', (req, res) => {
    if (req.cookies?.token) {
      res.send(`You requested ${req.url}`);
      res.end();
    } else {
      res.cookie('redirect', req.url, { secure: true });
      res.redirect(
        client.generateAuthUrl({
          access_type: 'offline',
          scope: 'https://www.googleapis.com/auth/devstorage.read_only'
        })
      );
      res.end();
    }
  });

  app.listen(process.env.PORT || 8080);
})();
