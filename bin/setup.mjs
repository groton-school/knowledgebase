#!/usr/bin/env node
import gcloud from '@battis/partly-gcloudy';
import cli from '@battis/qui-cli';
import fs from 'fs/promises';
import path from 'path';

const options = JSON.parse(
  await fs.readFile(new URL('./options.json', import.meta.url))
);

(async () => {
  const args = await gcloud.init({
    args: {
      options,
      flags: {
        deploy: {
          description:
            'Include the (time-consuming) deploy step to App Engine (default true, --no-deploy to skip)'
        }
      }
    }
  });
  if (args.values.verbose) {
    cli.shell.setSilent(false);
  }

  if (gcloud.ready()) {
    const { project, appEngine } = await gcloud.batch.appEnginePublish({
      name: args.values.name,
      id: args.values.project,
      suggestedName: 'Knowledgebase',
      billingAccountId: args.values.billing,
      region: args.values.region,
      env: { keys: { urlVar: 'URL' } },
      prebuild: () => {
        return true;
      },
      deploy: args.values.deploy
    });

    await gcloud.services.enable(gcloud.services.API.GoogleDocsAPI);
    await gcloud.services.enable(gcloud.services.API.GoogleDriveAPI);
    await gcloud.services.enable(gcloud.services.API.GoogleCloudStorageJSONAPI);

    const member = await cli.prompts.input({
      message: options.member.description,
      default: args.values.member || process.env.MEMBER,
      validate: cli.validators.email
    });
    cli.env.set('MEMBER', member);
    await gcloud.iam.addPolicyBinding({
      member,
      role: 'roles/storage.admin'
    });

    const bucket = await cli.prompts.input({
      message: options.bucket.description,
      default:
        args.values.bucket ||
        process.env.BUCKET ||
        gcloud.lib.generate.projectId(),
      validate: cli.validators.lengthBetween(6, 30)
    });
    cli.env.set('BUCKET', bucket);
    cli.shell.exec(
      `gcloud storage buckets create gs://${bucket} --location=${appEngine.locationId} --format=json --project=${project.projectId}`
    );
    cli.shell.exec(
      `gcloud storage buckets update gs://${bucket} --project=${project.projectId} --public-access-prevention --no-uniform-bucket-level-access`
    );

    cli.log.info(`
You need to manually configure the OAuth Consent screen at ${cli.colors.url(
      `https://console.cloud.google.com/apis/credentials/consent?project=${project.projectId}`
    )}
`);

    cli.shell.mkdir('-p', path.join(cli.appRoot(), 'packages/builder/var'));
    cli.log.info(`
You need to manually create and download keys for the ${cli.colors.command(
      'builder'
    )} at ${cli.colors.url(
      `https://console.cloud.google.com/apis/credentials?project=${project.projectId}`
    )}
  - Create client: ${cli.colors.value('OAuth Client ID')}
  - Application Type: ${cli.colors.value('web application')}
  - Authorized redirect URI: ${cli.colors.url(
    'https://localhost:3000/oauth2callback'
  )}

Download these credentials to ${cli.colors.url(
      path.join(cli.appRoot(), 'packages/builder/var/keys.json')
    )}
`);

    const configFilePath = path.join(
      cli.appRoot(),
      'packages/server/var/config.json'
    );
    let config = {};
    if (await fs.exists(configFilePath)) {
      config = JSON.parse((await fs.readFile(configFilePath)).toString());
    } else {
      cli.shell.mkdir('-p', path.dirname(configFilePath));
    }
    config.storage.bucket = bucket;
    await fs.writeFile(configFilePath, JSON.stringify(config));
    cli.log.info(`
You need to manually create and download keys for the ${cli.colors.command(
      'server'
    )} at ${cli.colors.url(
      `https://console.cloud.google.com/apis/credentials?project=${project.projectId}`
    )}
  - Create client: ${cli.colors.value('OAuth Client ID')}
  - Application Type: ${cli.colors.value('web application')}
  - Authorized Javascript origin: ${cli.colors.url(
    `https://${appEngine.defaultHostname}`
  )}
  - Authorized redirect URI: ${cli.colors.url(
    `https://${appEngine.defaultHostname}/oauth2callback`
  )}

Download these credentials to ${cli.colors.url(
      path.join(path.dirname(configFilePath), 'keys.json')
    )}
`);
  }
})();
