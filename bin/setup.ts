import gcloud from '@battis/partly-gcloudy';
import cli from '@battis/qui-cli';
import Var from '@groton/knowledgebase.config';
import fs from 'fs';
import path from 'path';

const options = {
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
      name,
      region,
      project,
      billing,
      verbose,
      permissionsRegex,
      bucket
    }
  } = await gcloud.init({
    args: {
      options
    }
  });
  if (verbose) {
    cli.shell.setSilent(false);
  }

  if (gcloud.ready()) {
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

      await gcloud.services.enable(gcloud.services.API.GoogleDocsAPI);
      await gcloud.services.enable(gcloud.services.API.GoogleDriveAPI);
      await gcloud.services.enable(
        gcloud.services.API.GoogleCloudStorageJSONAPI
      );
      await gcloud.services.enable(gcloud.services.API.CloudIdentityAPI);
      await gcloud.services.enable(gcloud.services.API.CloudFirestoreAPI);

      permissionsRegex =
        permissionsRegex ||
        process.env.PERMISSIONS_REGEX ||
        (await cli.prompts.input({
          message: options.permissionsRegex.description,
          default: '.*',
          validate: cli.validators.notEmpty
        }));
      cli.env.set({ key: 'PERMISSIONS_REGEX', value: permissionsRegex });

      bucket =
        bucket ||
        process.env.BUCKET ||
        (await cli.prompts.input({
          message: options.bucket.description,
          default: gcloud.lib.generate.projectId(),
          validate: cli.validators.lengthBetween(6, 30)
        }));
      cli.env.set({ key: 'BUCKET', value: bucket });
      cli.shell.exec(
        `gcloud storage buckets create gs://${bucket} --location=${appEngine.locationId} --format=json --project=${project.projectId}`
      );
      cli.shell.exec(
        `gcloud storage buckets update gs://${bucket} --project=${project.projectId} --public-access-prevention --no-uniform-bucket-level-access`
      );

      // enable Application Default Credentials for updating Google Cloud Storage
      cli.shell.exec(
        `gcloud auth application-default login --project=${project.projectId} --format=json --quiet`
      );

      // TODO collect environment variable values

      cli.log.info(`
You need to manually configure the OAuth Consent screen at ${cli.colors.url(
        `https://console.cloud.google.com/apis/credentials/consent?project=${project.projectId}`
      )}
`);

      cli.shell.mkdir('-p', path.join(cli.appRoot(), 'apps/indexer/var'));
      cli.log.info(`
You need to manually create and download keys for the ${cli.colors.command(
        'indexer'
      )} at ${cli.colors.url(
        `https://console.cloud.google.com/apis/credentials?project=${project.projectId}`
      )}
  - Create client: ${cli.colors.value('OAuth Client ID')}
  - Application Type: ${cli.colors.value('web application')}
  - Authorized redirect URI: ${cli.colors.url(
    'https://localhost:3000/oauth2callback'
  )}

Download these credentials to ${cli.colors.url(
        path.join(cli.appRoot(), 'apps/indexer/var/keys.json')
      )}
`);

      const configFilePath = path.join(
        cli.appRoot(),
        'apps/router/var/config.json'
      );
      let config: Partial<Var.Config> = {};
      if (fs.existsSync(configFilePath)) {
        config = JSON.parse(fs.readFileSync(configFilePath).toString());
      } else {
        cli.shell.mkdir('-p', path.dirname(configFilePath));
      }
      config = {
        ...config,
        storage: {
          ...config.storage,
          bucket
        }
      };
      fs.writeFileSync(configFilePath, JSON.stringify(config));
      cli.log.info(`
You need to manually create and download keys for the ${cli.colors.command(
        'router'
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
  } else {
    cli.log.error(`Error setting up App Engine instance`);
  }
})();
