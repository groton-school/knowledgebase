import gcloud from '@battis/partly-gcloudy';
import CLI from '@battis/qui-cli';
import path from 'node:path';

await CLI.configure({
  root: { root: path.resolve(import.meta.dirname, '../.tmp/isolate') },
  env: { path: path.resolve(import.meta.dirname, '../../../.env') }
});
await CLI.init();
await gcloud.batch.appEngineDeployAndCleanup({ retainVersions: 2 });
