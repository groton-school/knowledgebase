import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';

let pathToConfig = path.resolve(import.meta.dirname, '../var/config.json');

const {
  values: { configPath }
} = cli.init({
  env: {
    root: path.dirname(import.meta.dirname),
    loadDotEnv: path.resolve(import.meta.dirname, '../../../.env')
  },
  args: {
    options: {
      configPath: {
        short: 'c',
        description: `Path to config file, defaults to ${cli.colors.url(
          pathToConfig
        )}`,
        default: pathToConfig
      }
    }
  }
});

function quoted(key: string, value: string = '') {
  switch (key) {
    case 'primaryColor':
      return value;
    default:
      return `"${value}"`;
  }
}

const spinner = cli.spinner();
pathToConfig = path.resolve(import.meta.dirname, '..', configPath);
spinner.start(`Loading configuration ${cli.colors.url(pathToConfig)}`);
const config = JSON.parse(fs.readFileSync(pathToConfig).toString());
spinner.succeed(`Configuration ${cli.colors.url(pathToConfig)}`);

const pathToScss = path.resolve(import.meta.dirname, '../src/config.scss');
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
spinner.succeed(`Configuration applied to ${cli.colors.url(pathToScss)}`);

const pathToTs = path.resolve(import.meta.dirname, '../src/config.ts');
spinner.start(`Updating ${cli.colors.url(pathToTs)}`);
if (config.ui?.site) {
  fs.writeFileSync(pathToTs, `export default ${JSON.stringify(config.ui)}`);
}
spinner.succeed(`Configuration applied to ${cli.colors.url(pathToTs)}`);
