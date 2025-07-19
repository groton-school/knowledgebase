import { Config } from '@groton/knowledgebase.config';
import path from 'node:path';

Config.sync({
  env: {
    root: path.dirname(import.meta.dirname),
    loadDotEnv: path.resolve(import.meta.dirname, '../../../.env')
  }
});
