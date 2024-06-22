#!/usr/bin/env tsx
import File from '../src/File';
import Folder from '../src/Folder';
import Client from '../src/Google/Client';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FOLDER_ID = '%FOLDER_ID%';
const FOLDER_NAME = '%FOLDER_NAME%';
const TIMESTAMP = '%TIMESTAMP%';

const options = {
  folderId: {
    short: 'f',
    description:
      'Google Drive ID of folder to index (will default to environment variable ROOT_FOLDER_ID if present)'
  },
  output: {
    short: 'o',
    description: `Output JSON file path (use ${FOLDER_NAME}, ${FOLDER_ID}, and ${TIMESTAMP} placeholders, if so desired). If the file already exists, the index will be updated/`,
    default: path.join(__dirname, '../../server/var/index.json')
  },
  keys: {
    short: 'k',
    description: 'Path to file containing downloaded OAuth 2 credentials',
    default: path.join(__dirname, '../var/keys.json')
  },
  tokens: {
    short: 't',
    description: 'Path to file containing access tokens',
    default: path.join(__dirname, '../var/tokens.json')
  }
};

(async () => {
  const cwd = process.cwd();
  const { values } = cli.init({
    env: {
      root: path.join(__dirname, '../../..'),
      loadDotEnv: path.join(__dirname, '../../../.env')
    },
    args: { options }
  });

  Client.init({ keysPath: values.keys, tokensPath: values.tokens });

  let indexPath = path.resolve(cwd, values.output);
  if (fs.existsSync(indexPath)) {
    // sync
    /*    const spinner = cli.spinner();
    spinner.start(`Loading index from ${cli.colors.url(indexPath)}`);
    const prevTree: Tree = JSON.parse(
      fs.readFileSync(indexPath).toString()
    ) as Tree;
    spinner.succeed(
      `${cli.colors.value(prevTree.folder['.'].name)} index loaded`
    );

    spinner.start('Indexing');
    const nextTree = await buildTree(prevTree.folder['.'].id!, spinner);
    spinner.succeed(`Indexed ${cli.colors.value(nextTree.folder['.'].name)}`);

    spinner.start(`Writing index to ${cli.colors.url(indexPath)}`);
    nextTree.folder = mergeTrees(prevTree.folder, nextTree.folder);

    fs.writeFileSync(indexPath, JSON.stringify(nextTree, null, 2));

    spinner.succeed(`Updated index at ${cli.colors.url(indexPath)}`); */
  } else {
    // build from scratch
    const spinner = cli.spinner();
    spinner.start('Indexing');
    Folder.event.on(File.Event.Start, (status): void => {
      spinner.start(
        cli.colors.url(path.dirname(status) + '/') +
          cli.colors.value(path.basename(status))
      );
    });
    Folder.event.on(File.Event.Succeed, (status): void => {
      spinner.succeed(
        cli.colors.url(path.dirname(status) + '/') +
          cli.colors.value(path.basename(status))
      );
    });
    Folder.event.on(File.Event.Fail, (status): void => {
      spinner.fail(
        cli.colors.url(path.dirname(status) + '/') +
          cli.colors.value(path.basename(status))
      );
    });
    const folderId =
      values.folderId ||
      process.env.ROOT_FOLDER_ID ||
      (await cli.prompts.input({
        message: options.folderId.description,
        validate: cli.validators.notEmpty
      }));
    const folder = await Folder.fromDriveId(folderId);
    const indexPath = path.resolve(
      cwd,
      (
        values.output ||
        (await cli.prompts.input({
          message: options.output.description,
          default: path.resolve(cli.appRoot(), '../server/var/index.json'),
          validate: cli.validators.notEmpty
        }))
      )
        .replace(FOLDER_ID, folderId)
        .replace(FOLDER_NAME, folder.name!)
        .replace(TIMESTAMP, new Date().toISOString().replace(':', '-'))
    );
    spinner.start(`Writing index to ${indexPath}`);
    const content = JSON.stringify(folder, null, 2);
    cli.shell.mkdir('-p', path.dirname(indexPath));
    fs.writeFileSync(indexPath, content);
    spinner.succeed(`Wrote index to ${cli.colors.url(indexPath)}`);
  }
})();
