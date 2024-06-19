import type GoogleOAuthCredentials from '../Models/GoogleOAuthCredentials';
import cli from '@battis/qui-cli';
import express from 'express';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import open from 'open';
import path from 'path';

const GOOGLE_API_TOKENS = 'GOOGLE_API_TOKENS';
let logged = false;

async function authorize(
  spinner?: ReturnType<typeof cli.spinner>
): Promise<OAuth2Client> {
  !logged && spinner?.start('Authenticating');
  return new Promise(async (resolve, reject) => {
    const possibleCredentials = fs
      .readdirSync(path.join(process.cwd(), 'var'))
      .filter((file) => file.match(/^client_secret.*\.json$/));
    var credentialPath: string;
    switch (possibleCredentials.length) {
      case 0:
        const error = 'No credential file present';
        spinner?.fail(error);
        reject(error);
        return;
      case 1:
        credentialPath = possibleCredentials.shift()!;
        break;
      default:
        spinner?.info('Multiple credential files present');
        credentialPath = await cli.prompts.select({
          message: 'Which credential file?',
          choices: possibleCredentials.map((p) => ({ value: p }))
        });
        spinner?.start('Authenticating');
    }

    const credentials: GoogleOAuthCredentials = JSON.parse(
      fs.readFileSync(path.join('var', credentialPath)).toString()
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

    var tokens = JSON.parse(cli.env.get({ key: GOOGLE_API_TOKENS }) ?? 'null');
    if (tokens) {
      client.setCredentials(tokens);
      !logged && spinner?.succeed('Authenticated in environment');
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
        cli.env.set({ key: GOOGLE_API_TOKENS, value: JSON.stringify(tokens) });
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
