import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';
import config from './lockfile.config.json';

cli.init({
  env: {
    root: path.resolve(import.meta.dirname, '../'),
    loadDotEnv: path.resolve(import.meta.dirname, '../../../.env')
  }
});

const pkgPath = path.resolve(import.meta.dirname, config.packagePath);
const pkgPathActual = path.resolve(
  import.meta.dirname,
  config.packagePathActual
);

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
