import gcloud from '@battis/partly-gcloudy';
import cli from '@battis/qui-cli';
import path from 'node:path';

console.log(process.env);

cli.configure({
  root: { root: path.resolve(import.meta.dirname, '../.tmp/isolate') },
  env: { path: path.resolve(import.meta.dirname, '../../../.env') }
});
await cli.init();
await gcloud.batch.appEngineDeployAndCleanup({ retainVersions: 2 });
