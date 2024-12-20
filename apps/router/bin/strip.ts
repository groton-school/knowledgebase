import cli from '@battis/qui-cli';
import fs from 'node:fs';
import path from 'node:path';

const backupDefault = 'package.actual.json';

const {
  values: { backup = backupDefault, strip: _strip }
} = cli.init({
  args: {
    requirePositionals: false,
    opt: {
      backup: {
        description: `Path to backup of the actual ${cli.colors.value('package.json')} file. (Default: ${cli.colors.quotedValue(`"${backupDefault}"`)})`,
        default: backupDefault
      }
    },
    flag: {
      strip: {
        description: `Strip the actual ${cli.colors.value('package.json')} file by removing any ${cli.colors.quotedValue(`"workspace:*"`)} dependencies. If ${cli.colors.value('--no-isolate')} passed, restore the actual ${cli.colors.value('package.json')}. Backup location is set by ${cli.colors.value('--backup')}. (default: ${cli.colors.value('--no-isolate')})`
      }
    }
  }
});

const strip = !!_strip;
const appPath = path.dirname(import.meta.dirname);
const pkgPath = path.join(appPath, 'package.json');
const backupPath = path.join(appPath, backup);

if (strip) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath).toString());
  pkg.dependencies = Object.keys(pkg.dependencies)
    .filter((key) => pkg.dependencies[key] !== 'workspace:*')
    .reduce((dependencies, key) => {
      dependencies[key] = pkg.dependencies[key];
      return dependencies;
    }, {});
  fs.renameSync(pkgPath, backupPath);
  cli.log.info(
    `${cli.colors.url(pkgPath)} backed up to ${cli.colors.url(backupPath)}`
  );
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  cli.log.info(`Stripped manifest written to ${cli.colors.url(pkgPath)}`);
} else {
  if (fs.existsSync(backupPath)) {
    fs.rmSync(pkgPath);
    fs.renameSync(backupPath, pkgPath);
    cli.log.info(
      `${cli.colors.url(pkgPath)} restored from ${cli.colors.url(backupPath)}`
    );
  } else {
    cli.log.warning(`No backup found at ${cli.colors.url(backupPath)}`);
  }
}
