import * as gcloud from '@battis/partly-gcloudy';
import cli from '@battis/qui-cli';
import path from 'node:path';

(async () => {
  await gcloud.init({
    env: {
      root: path.resolve(import.meta.dirname, '../.tmp/isolate'),
      loadDotEnv: path.resolve(import.meta.dirname, '../../../.env')
    }
  });
  cli.init({
    env: {
      root: path.resolve(import.meta.dirname, '../.tmp/isolate'),
      loadDotEnv: path.resolve(import.meta.dirname, '../../../.env')
    }
  });
  try {
    await gcloud.batch.appEngineDeployAndCleanup({ retainVersions: 2 });
    cli.log.info('Deploy complete.');
  } catch (e) {
    cli.log.error(e);
  }
})();
