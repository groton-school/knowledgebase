import type GoogleOAuthCredentials from '../Models/GoogleOAuthCredentials';
import cli from '@battis/qui-cli';
import express from 'express';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import open from 'open';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let logged = false;

async function authorize(
  spinner?: ReturnType<typeof cli.spinner>
): Promise<OAuth2Client> {
  !logged && spinner?.start('Authenticating');
  return new Promise(async (resolve, reject) => {
    const credentials: GoogleOAuthCredentials = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../var/keys.json')).toString()
    );
    const redirectUri = new URL(
      credentials.web.redirect_uris
        ? credentials.web.redirect_uris
            .filter((uri: string) => uri.match(/^http:\/\/localhost/))
            .shift()!
        : await cli.prompts.input({ message: 'Redirect URI' })
    );
    const client = new OAuth2Client({
      clientId: credentials.web.client_id,
      clientSecret: credentials.web.client_secret,
      redirectUri: redirectUri.href
    });

    let tokens;
    let tokenPath = path.join(__dirname, '../../var/tokens.json');
    if (fs.existsSync(tokenPath)) {
      tokens = JSON.parse(fs.readFileSync(tokenPath).toString());
    }
    if (tokens) {
      client.setCredentials(tokens);
      !logged && spinner?.succeed('Authenticated with cached token');
      resolve(client);
      logged = true;
      return;
    }

    spinner?.start('Authenticating in web browser');
    const app = express();
    const server = app.listen(redirectUri.port);
    app.get('/favicon.ico', (_, response) => response.send());
    app.get('*', async (request, response) => {
      response.send('You may close this window.');
      server.close();
      if (request.path != redirectUri.pathname) {
        const error = `Path mismatch (expected '${redirectUri.pathname}', received '${request.path}'`;
        spinner?.fail(error);
        reject(error);
      }
      if (request.query.error) {
        const error = JSON.stringify(request.query);
        spinner?.fail(error);
        reject(error);
      }
      if (request.query.code) {
        const { tokens } = await client.getToken(request.query.code.toString());
        fs.writeFileSync(tokenPath, JSON.stringify(tokens));
        client.setCredentials(tokens);
        spinner?.succeed('Authenticated in web browser');
        resolve(client);
      }
    });
    open(
      client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/drive'
      })
    );
  });
}

export default authorize;
