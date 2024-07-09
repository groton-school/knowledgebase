#!/usr/bin/env tsx
import gcloud from '@battis/partly-gcloudy';
import cli from '@battis/qui-cli';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  await gcloud.init({
    env: {
      root: path.resolve(__dirname, '..'),
      loadDotEnv: path.resolve(__dirname, '../../../.env')
    }
  });
  cli.init({
    env: {
      root: path.resolve(__dirname, '..'),
      loadDotEnv: path.resolve(__dirname, '../../../.env')
    }
  });
  try {
    await gcloud.batch.appEngineDeployAndCleanup({ retainVersions: 2 });
    cli.log.info('Deploy complete.');
  } catch (e) {
    cli.log.error(e);
  }
})();
