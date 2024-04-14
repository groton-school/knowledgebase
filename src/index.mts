import cli from '@battis/qui-cli';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { google, drive_v3 } from 'googleapis';
import open from 'open';
import path from 'path';

type GoogleOAuthCredentials = {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    client_secret: string;
    redirect_uris?: string[];
  };
};

type FileDescription = {
  id: string;
  name: string;
  access: string[];
};

type FolderDescription = {
  [name: string]: FileDescription | FolderDescription;
};

const GOOGLE_API_TOKENS = 'GOOGLE_API_TOKENS';

dotenv.config();

cli.init();

async function authorize(): Promise<OAuth2Client> {
  const spinner = cli.spinner();
  spinner.start('Authenticating');
  return new Promise(async (resolve, reject) => {
    const possibleCredentials = fs
      .readdirSync(process.cwd())
      .filter((file) => file.match(/^client_secret.*\.json$/));
    var credentialPath: string;
    switch (possibleCredentials.length) {
      case 0:
        const error = 'No credential file present';
        spinner.fail(error);
        reject(error);
        return;
      case 1:
        credentialPath = possibleCredentials.shift()!;
        break;
      default:
        spinner.info('Multiple credential files present');
        credentialPath = await cli.prompts.select({
          message: 'Which credential file?',
          choices: possibleCredentials.map((p) => ({ value: p }))
        });
        spinner.start('Authenticating');
    }

    const credentials: GoogleOAuthCredentials = JSON.parse(
      fs.readFileSync(credentialPath).toString()
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
      spinner.succeed('Authenticated in environment');
      resolve(client);
      return;
    }

    spinner.start('Authenticating in web browser');
    const app = express();
    const server = app.listen(redirectUri.port);
    app.get('/favicon.ico', (request, response) => response.send());
    app.get('*', async (request, response) => {
      response.send('You may close this window.');
      server.close();
      if (request.path != redirectUri.pathname) {
        const error = `Path mismatch (expected '${redirectUri.pathname}', received '${request.path}'`;
        spinner.fail(error);
        reject(error);
      }
      if (request.query.error) {
        const error = JSON.stringify(request.query);
        spinner.fail(error);
        reject(error);
      }
      if (request.query.code) {
        const { tokens } = await client.getToken(request.query.code.toString());
        cli.env.set({ key: GOOGLE_API_TOKENS, value: JSON.stringify(tokens) });
        client.setCredentials(tokens);
        spinner.succeed('Authenticated in web browser');
        resolve(client);
      }
    });
    open(
      client.generateAuthUrl({
        scope: 'https://www.googleapis.com/auth/drive'
      })
    );
  });
}

var drive: drive_v3.Drive;

(async () => {
  const client = await authorize();
  const spinner = cli.spinner();
  const drive = google.drive({ version: 'v3', auth: client });
  var tree: FolderDescription = {};

  async function folderContents(
    folderId: string,
    folderPath: string
  ): Promise<FolderDescription> {
    spinner.start(folderPath);
    const tree: FolderDescription = {
      '.': folderId
    };
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`
    });
    if (response.data.files?.length) {
      for (const file of response.data.files) {
        if (file.mimeType == 'application/vnd.google-apps.folder') {
          tree[file.name!] = await folderContents(
            file.id!,
            `${path.join(folderPath, file.name!)}`
          );
        } else {
          const permissions = await drive.permissions.list({
            fileId: file.id!
          });
          const access: string[] = [];
          for (const permission of permissions.data.permissions!) {
            access.push(
              (
                await drive.permissions.get({
                  fileId: file.id!,
                  permissionId: permission.id,
                  fields: 'emailAddress'
                })
              ).data.emailAddress
            );
          }
          tree[file.name!] = {
            id: file.id!,
            name: file.name!,
            access
          };
        }
      }
    }
    return tree;
  }

  spinner.start('Indexing');

  const response = await drive.files.get({
    fileId: process.env.ROOT_FOLDER_ID
  });
  spinner.start(response.data.name!);

  const subtree = await folderContents(
    process.env.ROOT_FOLDER_ID!,
    response.data.name!
  );
  tree[response.data.name!] = subtree;
  spinner.succeed('Indexed');
  const content = JSON.stringify(tree, null, 2);
  fs.writeFileSync(
    `${response.data.name}_${new Date().toISOString()}.json`,
    content
  );
})();
