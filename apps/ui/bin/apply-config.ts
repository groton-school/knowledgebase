import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';

let pathToConfig = path.resolve(__dirname, '../var/config.json');

const {
  values: { configPath }
} = cli.init({
  env: {
    root: path.dirname(__dirname),
    loadDotEnv: path.resolve(__dirname, '../../../.env')
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
pathToConfig = path.resolve(__dirname, '..', configPath);
spinner.start(`Loading configuration ${cli.colors.url(pathToConfig)}`);
const config = JSON.parse(fs.readFileSync(pathToConfig).toString());
spinner.succeed(`Configuration ${cli.colors.url(pathToConfig)}`);

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
spinner.succeed(`Configuration applied to ${cli.colors.url(pathToScss)}`);

const pathToTs = path.resolve(__dirname, '../src/config.ts');
spinner.start(`Updating ${cli.colors.url(pathToTs)}`);
if (config.ui?.site) {
  fs.writeFileSync(pathToTs, `export default ${JSON.stringify(config.ui)}`);
}
spinner.succeed(`Configuration applied to ${cli.colors.url(pathToTs)}`);
