#!/usr/bin/env node
import options from './options.json' assert {type: 'json'};
import gcloud from '@battis/partly-gcloudy';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';

(async () => {
  const args = await gcloud.init({
      env:{root: process.cwd()},
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
    const { project } = await gcloud.batch.appEnginePublish({
      name: args.values.name,
      id: args.values.project,
      suggestedName: 'Blackbaud-to-Google Group Sync',
      billingAccountId: args.values.billing,
      region: args.values.region,
      env: { keys: { urlVar: 'URL' } },
      prebuild: () => {
        return true;
      },
      deploy: args.values.deploy
    });

    // must create an instance so that IAP can be configured
    if (!args.values.built) {
      cli.shell.exec('npm run build');
    }
    if (!args.values.deployed) {
      cli.shell.exec('npm run deploy');
    }

    // enable IAP to limit access to app
    await gcloud.iap.enable({
      applicationTitle: project.name,
      supportEmail: args.values.supportEmail,
      users: args.values.users
    });
  }
})();
