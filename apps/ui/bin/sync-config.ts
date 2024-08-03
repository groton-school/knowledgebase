import Var from '@groton/knowledgebase.config';
import path from 'path';

Var.Config.sync(
  {
    env: {
      root: path.dirname(__dirname),
      loadDotEnv: path.resolve(__dirname, '../../../.env')
    }
  },
  (config) => {
    for (const prop in config) {
      if (prop != 'ui') {
        delete config[prop];
      }
    }
    return config;
  }
);
