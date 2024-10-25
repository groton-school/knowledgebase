import cli from '@battis/qui-cli';
import { makeDedicatedLockfile } from '@pnpm/make-dedicated-lockfile';
import fs from 'node:fs';
import path from 'node:path';
import config from './lockfile.config.json';

(async () => {
  cli.init({
    env: {
      root: path.resolve(import.meta.dirname, '../'),
      loadDotEnv: path.resolve(import.meta.dirname, '../../../.env')
    }
  });

  const spinner = cli.spinner();
  const pkgPath = path.resolve(import.meta.dirname, config.packagePath);
  const pkgPathActual = path.resolve(
    import.meta.dirname,
    config.packagePathActual
  );

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
      path.resolve(import.meta.dirname, '../../..'),
      path.resolve(import.meta.dirname, '..')
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
