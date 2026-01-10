import gcloud from '@battis/partly-gcloudy';
import * as lib from '@battis/partly-gcloudy/dist/lib/index.js';
import { Config } from '@groton/knowledgebase.config';
import { input } from '@inquirer/prompts';
import { Colors } from '@qui-cli/colors';
import { Core } from '@qui-cli/core';
import { Env } from '@qui-cli/env-1password';
import { Log } from '@qui-cli/log';
import { Root } from '@qui-cli/root';
import { Shell } from '@qui-cli/shell';
import { Validators } from '@qui-cli/validators';
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
  } = await Core.init({
    opt
  });
  if (verbose) {
    Shell.configure({ silent: false });
  }

  const publishResponse = await gcloud.batch.appEnginePublish({
    name,
    projectId: project,
    suggestedName: 'Knowledgebase',
    billingAccountId: billing,
    region,
    deploy: false
  });

  if (publishResponse) {
    const { project, appEngine } = publishResponse;

    // TODO generate and post API Keys for router
    await gcloud.batch.app.enableSecretsAccess();

    await gcloud.services.enable(gcloud.services.API.GoogleDocsAPI);
    await gcloud.services.enable(gcloud.services.API.GoogleDriveAPI);
    await gcloud.services.enable(gcloud.services.API.GoogleCloudStorageJSONAPI);
    await gcloud.services.enable(gcloud.services.API.CloudIdentityAPI);

    await gcloud.services.enable(gcloud.services.API.CloudFirestoreAPI);
    const [{ name: database }] = JSON.parse(
      Shell.exec(
        `gcloud firestore databases list --project=${project.projectId} --format=json --quiet`
      )
    );
    Shell.exec(
      `gcloud firestore databases update --type=firestore-native --database="${database}" --project=${project.projectId} --format=json --quiet`
    );

    permissionsRegex =
      permissionsRegex ||
      process.env.PERMISSIONS_REGEX ||
      (await input({
        message: opt.permissionsRegex.description,
        default: '.*',
        validate: Validators.notEmpty
      }));
    Env.set({ key: 'PERMISSIONS_REGEX', value: permissionsRegex });

    bucket =
      bucket ||
      process.env.BUCKET ||
      (await input({
        message: opt.bucket.description,
        default: lib.generate.projectId(),
        validate: Validators.lengthBetween(6, 30)
      }));
    Env.set({ key: 'BUCKET', value: bucket });
    Shell.exec(
      `gcloud storage buckets create gs://${bucket} --location=${appEngine.locationId} --format=json --project=${project.projectId}`
    );
    Shell.exec(
      `gcloud storage buckets update gs://${bucket} --project=${project.projectId} --public-access-prevention --no-uniform-bucket-level-access`
    );

    // enable Application Default Credentials for updating Google Cloud Storage
    Shell.exec(
      `gcloud auth application-default login --project=${project.projectId} --format=json --quiet`
    );

    // TODO collect environment variable values

    Log.info(`
You need to manually configure the OAuth Consent screen at ${Colors.url(
      `https://console.cloud.google.com/apis/credentials/consent?project=${project.projectId}`
    )}
`);

    Shell.mkdir('-p', path.join(Root.path(), 'apps/indexer/var'));
    Log.info(`
You need to manually create and download keys for the ${Colors.command(
      'indexer'
    )} at ${Colors.url(
      `https://console.cloud.google.com/apis/credentials?project=${project.projectId}`
    )}
  - Create client: ${Colors.value('OAuth Client ID')}
  - Application Type: ${Colors.value('web application')}
  - Authorized redirect URI: ${Colors.url(
    'https://localhost:3000/oauth2callback'
  )}

Download these credentials to ${Colors.url(
      path.join(Root.path(), 'apps/indexer/var/keys.json')
    )}
`);

    const configFilePath = path.join(
      Root.path(),
      'apps/router/var/config.json'
    );
    let config: Partial<Config.Config> = {};
    if (fs.existsSync(configFilePath)) {
      config = JSON.parse(fs.readFileSync(configFilePath).toString());
    } else {
      Shell.mkdir('-p', path.dirname(configFilePath));
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
    Log.info(`
You need to manually create and download keys for the ${Colors.command(
      'router'
    )} at ${Colors.url(
      `https://console.cloud.google.com/apis/credentials?project=${project.projectId}`
    )}
  - Create client: ${Colors.value('OAuth Client ID')}
  - Application Type: ${Colors.value('web application')}
  - Authorized Javascript origin: ${Colors.url(
    `https://${appEngine.defaultHostname}`
  )}
  - Authorized redirect URI: ${Colors.url(
    `https://${appEngine.defaultHostname}/oauth2callback`
  )}

Download these credentials to ${Colors.path(
      path.join(path.dirname(configFilePath), 'keys.json')
    )}
`);
  }
})();
