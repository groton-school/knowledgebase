const express = require('express');
const cookieParser = require('cookie-parser');
const { OAuth2Client } = require('google-auth-library');

const credentials = require('../credentials.json');

const redirectURI = new URL(credentials.web.redirect_uris[0]);
const oauth2 = new OAuth2Client(
  credentials.web.client_id,
  credentials.web.client_secret,
  redirectURI.href
);

const app = express();
app.use(cookieParser());

app.get('/logout', (_, res) => {
  res.clearCookie('token');
  res.send('logged out');
  res.end();
});
app.get(redirectURI.pathname, async (req, res) => {
  const redirect = req.cookies?.redirect || '/';
  res.clearCookie('redirect');
  res.cookie('token', await oauth2.getToken(req.cookies.code));
  res.redirect(redirect);
  res.end();
});
app.get('/*', (req, res) => {
  if (req.cookies?.token) {
    res.send(`You requested ${req.url}`);
    res.end();
  } else {
    res.cookie('redirect', req.url);
    res.redirect(
      oauth2.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/devstorage.read_only'
      })
    );
    res.end();
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
