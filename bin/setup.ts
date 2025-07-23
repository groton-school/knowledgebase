import gcloud from '@battis/partly-gcloudy';
import * as lib from '@battis/partly-gcloudy/dist/lib.js';
import CLI from '@battis/qui-cli';
import { Config } from '@groton/knowledgebase.config';
import { input } from '@inquirer/prompts';
import fs from 'node:fs';
import path from 'node:path';

const opt = {
  name: {
    description: 'Google Cloud project name',
    default: 'Knowledgebase'
  },
  billing: {
    description: 'Google Cloud billing account ID for this project'
  },
  region: {
    description: 'Google Cloud region in which to create App Engine instance'
  },
  supportEmail: {
    description: 'Support email address for app OAuth consent screen'
  },
  bucket: {
    description: 'Google Cloud Storage Bucket ID to hold cached files'
  },
  permissionsRegex: {
    description:
      'Regular expression to email addresses of users/groups to include in Cloud Storage Bucket'
  }
};

(async () => {
  let {
    values: {
      // eslint-disable-next-line prefer-const
      name,
      // eslint-disable-next-line prefer-const
      region,
      // eslint-disable-next-line prefer-const
      project,
      // eslint-disable-next-line prefer-const
      billing,
      // eslint-disable-next-line prefer-const
      verbose,
      permissionsRegex,
      bucket
    }
  } = await CLI.init({
    opt
  });
  if (verbose) {
    CLI.shell.setSilent(false);
  }

  const publishResponse = await gcloud.batch.appEnginePublish({
    name,
    id: project,
    suggestedName: 'Knowledgebase',
    billingAccountId: billing,
    region,
    env: { keys: { urlVar: 'URL' } },
    deploy: false
  });

  if (publishResponse) {
    const { project, appEngine } = publishResponse;

    // TODO generate and post API Keys for router
    await gcloud.secrets.enableAppEngineAccess();

    await gcloud.services.enable(gcloud.services.API.GoogleDocsAPI);
    await gcloud.services.enable(gcloud.services.API.GoogleDriveAPI);
    await gcloud.services.enable(gcloud.services.API.GoogleCloudStorageJSONAPI);
    await gcloud.services.enable(gcloud.services.API.CloudIdentityAPI);

    await gcloud.services.enable(gcloud.services.API.CloudFirestoreAPI);
    const [{ name: database }] = JSON.parse(
      CLI.shell.exec(
        `gcloud firestore databases list --project=${project.projectId} --format=json --quiet`
      )
    );
    CLI.shell.exec(
      `gcloud firestore databases update --type=firestore-native --database="${database}" --project=${project.projectId} --format=json --quiet`
    );

    permissionsRegex =
      permissionsRegex ||
      process.env.PERMISSIONS_REGEX ||
      (await input({
        message: opt.permissionsRegex.description,
        default: '.*',
        validate: CLI.validators.notEmpty
      }));
    CLI.env.set({ key: 'PERMISSIONS_REGEX', value: permissionsRegex });

    bucket =
      bucket ||
      process.env.BUCKET ||
      (await input({
        message: opt.bucket.description,
        default: lib.generate.projectId(),
        validate: CLI.validators.lengthBetween(6, 30)
      }));
    CLI.env.set({ key: 'BUCKET', value: bucket });
    CLI.shell.exec(
      `gcloud storage buckets create gs://${bucket} --location=${appEngine.locationId} --format=json --project=${project.projectId}`
    );
    CLI.shell.exec(
      `gcloud storage buckets update gs://${bucket} --project=${project.projectId} --public-access-prevention --no-uniform-bucket-level-access`
    );

    // enable Application Default Credentials for updating Google Cloud Storage
    CLI.shell.exec(
      `gcloud auth application-default login --project=${project.projectId} --format=json --quiet`
    );

    // TODO collect environment variable values

    CLI.log.info(`
You need to manually configure the OAuth Consent screen at ${CLI.colors.url(
      `https://console.cloud.google.com/apis/credentials/consent?project=${project.projectId}`
    )}
`);

    CLI.shell.mkdir('-p', path.join(CLI.root.path(), 'apps/indexer/var'));
    CLI.log.info(`
You need to manually create and download keys for the ${CLI.colors.command(
      'indexer'
    )} at ${CLI.colors.url(
      `https://console.cloud.google.com/apis/credentials?project=${project.projectId}`
    )}
  - Create client: ${CLI.colors.value('OAuth Client ID')}
  - Application Type: ${CLI.colors.value('web application')}
  - Authorized redirect URI: ${CLI.colors.url(
    'https://localhost:3000/oauth2callback'
  )}

Download these credentials to ${CLI.colors.url(
      path.join(CLI.root.path(), 'apps/indexer/var/keys.json')
    )}
`);

    const configFilePath = path.join(
      CLI.root.path(),
      'apps/router/var/config.json'
    );
    let config: Partial<Config> = {};
    if (fs.existsSync(configFilePath)) {
      config = JSON.parse(fs.readFileSync(configFilePath).toString());
    } else {
      CLI.shell.mkdir('-p', path.dirname(configFilePath));
    }
    config = {
      ...config,
      storage: {
        ...config.storage,
        bucket
      }
    };
    fs.writeFileSync(configFilePath, JSON.stringify(config));

    // TODO amend to include information re: custom domain mapping
    CLI.log.info(`
You need to manually create and download keys for the ${CLI.colors.command(
      'router'
    )} at ${CLI.colors.url(
      `https://console.cloud.google.com/apis/credentials?project=${project.projectId}`
    )}
  - Create client: ${CLI.colors.value('OAuth Client ID')}
  - Application Type: ${CLI.colors.value('web application')}
  - Authorized Javascript origin: ${CLI.colors.url(
    `https://${appEngine.defaultHostname}`
  )}
  - Authorized redirect URI: ${CLI.colors.url(
    `https://${appEngine.defaultHostname}/oauth2callback`
  )}

Download these credentials to ${CLI.colors.url(
      path.join(path.dirname(configFilePath), 'keys.json')
    )}
`);
  }
})();
