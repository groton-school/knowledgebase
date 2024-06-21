#!/usr/bin/env tsx
import buildTree from '../src/Actions/buildTree';
import mergeTrees from '../src/Actions/mergeTrees';
import Tree from '../src/Schema/Tree';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO deal with _deleted_ files

(async () => {
  const { positionals } = cli.init({
    env: {
      root: path.join(__dirname, '../..'),
      loadDotEnv: path.join(__dirname, '../../.env')
    },
    args: { requirePositionals: 1 }
  });
  const indexPath = positionals[0].toString();
  const spinner = cli.spinner();
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

  spinner.succeed(`Updated index at ${cli.colors.url(indexPath)}`);
})();
