import cli from '@battis/qui-cli';
import Var from '@groton/knowledgebase.config';
import fs from 'fs';
import path from 'path';

const config = Var.Config.sync(
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

function quoted(key: string, value: string = '') {
  switch (key) {
    case 'primaryColor':
      return value;
    default:
      return `"${value}"`;
  }
}

const spinner = cli.spinner();
const pathToScss = path.resolve(__dirname, '../src/config.scss');
spinner.start(`Updating ${cli.colors.url(pathToScss)}`);
if (config.ui?.site) {
  fs.writeFileSync(
    pathToScss,
    Object.keys(config.ui.site || [])
      .map(
        (key) =>
          `$${key}: ${quoted(
            key,
            config.ui!.site![key as keyof typeof config.ui.site]
          )};`
      )
      .join('\n')
  );
}
spinner.succeed(`Configuration synced to ${cli.colors.url(pathToScss)}`);
