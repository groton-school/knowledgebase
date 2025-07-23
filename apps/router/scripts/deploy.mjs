import gcloud from '@battis/partly-gcloudy';
import { Core } from '@battis/qui-cli.core';

await Core.run();
await gcloud.batch.appEngineDeployAndCleanup({ retainVersions: 2 });
