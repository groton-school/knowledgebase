import config from './lockfile.config.json';
import cli from '@battis/qui-cli';
import { makeDedicatedLockfile } from '@pnpm/make-dedicated-lockfile';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  cli.init({
    env: {
      root: path.resolve(__dirname, '../'),
      loadDotEnv: path.resolve(__dirname, '../../../.env')
    }
  });

  const spinner = cli.spinner();
  const pkgPath = path.resolve(__dirname, config.packagePath);
  const pkgPathActual = path.resolve(__dirname, config.packagePathActual);

  spinner.start(`Pruning ${cli.colors.url(pkgPath)}`);

  const pkg = JSON.parse(fs.readFileSync(pkgPath).toString());

  delete pkg.devDependencies;
  for (const mod in pkg.dependencies) {
      if (/^workspace:/.test(pkg.dependencies[mod])) {
          delete pkg.dependencies[mod];
      }
  }

  if (!fs.existsSync(pkgPathActual)) {
    fs.renameSync(pkgPath, pkgPathActual);
    fs.writeFileSync(pkgPath, JSON.stringify(pkg));
    spinner.succeed(
      `Pruned ${cli.colors.url(pkgPath)} (backup saved in ${cli.colors.value(
        path.basename(pkgPathActual)
      )})`
    );

    spinner.start('Generating package-only lockfile');
    await makeDedicatedLockfile(
      path.resolve(__dirname, '../../..'),
      path.resolve(__dirname, '..')
    );
    spinner.succeed('Package-only lockfile generated');
  } else {
    spinner.fail(
      `${cli.colors.value(
        path.basename(pkgPathActual)
      )} already exists and cannot be overwritten`
    );
    spinner.fail(`Package-only lockfile ${cli.colors.error('not')} generated`);
  }
})();
