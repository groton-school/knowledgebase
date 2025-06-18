import CLI from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import ora from 'ora';

let pathToConfig = path.resolve(import.meta.dirname, '../var/config.json');

await CLI.configure({
  env: {
    root: path.dirname(import.meta.dirname),
    loadDotEnv: path.resolve(import.meta.dirname, '../../../.env')
  }
});
const {
  values: { configPath }
} = await CLI.init({
  opt: {
    configPath: {
      short: 'c',
      description: `Path to config file, defaults to ${CLI.colors.url(
        pathToConfig
      )}`,
      default: pathToConfig
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

const spinner = ora();
pathToConfig = path.resolve(
  import.meta.dirname,
  '..',
  configPath || pathToConfig
);
spinner.start(`Loading configuration ${CLI.colors.url(pathToConfig)}`);
const config = JSON.parse(fs.readFileSync(pathToConfig).toString());
spinner.succeed(`Configuration ${CLI.colors.url(pathToConfig)}`);

const pathToScss = path.resolve(import.meta.dirname, '../src/config.scss');
spinner.start(`Updating ${CLI.colors.url(pathToScss)}`);
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
spinner.succeed(`Configuration applied to ${CLI.colors.url(pathToScss)}`);

const pathToTs = path.resolve(import.meta.dirname, '../src/config.ts');
spinner.start(`Updating ${CLI.colors.url(pathToTs)}`);
if (config.ui?.site) {
  fs.writeFileSync(pathToTs, `export default ${JSON.stringify(config.ui)}`);
}
spinner.succeed(`Configuration applied to ${CLI.colors.url(pathToTs)}`);
