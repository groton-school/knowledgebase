import gcloud from '@battis/partly-gcloudy';
import cli from '@battis/qui-cli';
import path from 'node:path';

(async () => {
  await cli.configure({
    root: { cwd: path.resolve(import.meta.dirname, '../.tmp/isolate') },
    env: { path: path.resolve(import.meta.dirname, '../../../.env') }
  });
  await cli.init();
  try {
    await gcloud.batch.appEngineDeployAndCleanup({ retainVersions: 2 });
    cli.log.info('Deploy complete.');
  } catch (e) {
    cli.log.error(e);
  }
})();
