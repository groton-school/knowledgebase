import config from './lockfile.config.json';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cli.init({
  env: {
    root: path.resolve(__dirname, '../'),
    loadDotEnv: path.resolve(__dirname, '../../../.env')
  }
});

const pkgPath = path.resolve(__dirname, config.packagePath);
const pkgPathActual = path.resolve(__dirname, config.packagePathActual);

const spinner = cli.spinner();

spinner.start(
  `Restoring ${cli.colors.url(pkgPath)} from ${cli.colors.value(
    path.basename(pkgPathActual)
  )}`
);
if (fs.existsSync(pkgPathActual)) {
  fs.unlinkSync(pkgPath);
  fs.unlinkSync(path.resolve(path.dirname(pkgPath), 'pnpm-lock.yaml'));
  fs.renameSync(pkgPathActual, pkgPath);
  spinner.succeed(
    `${cli.colors.url(pkgPath)} restored from ${cli.colors.value(
      path.basename(pkgPathActual)
    )}`
  );
} else {
  spinner.fail(
    `No ${cli.colors.value(
      path.basename(pkgPathActual)
    )} to restore to ${cli.colors.url(pkgPath)}`
  );
}
