#!/usr/bin/env node
import gcloud from '@battis/partly-gcloudy';
import cli from '@battis/qui-cli';

await gcloud.init({
  env: { root: process.cwd() }
});
try {
  await gcloud.batch.appEngineDeployAndCleanup({ retainVersions: 2 });
  cli.log.info('Deploy complete.');
} catch (e) {
  cli.log.error(e);
}
