#!/usr/bin/env tsx
import buildTree from '../src/Actions/buildTree';
import FileDescription, {
  isFileDescription
} from '../src/Models/FileDescription';
import FolderDescription from '../src/Models/FolderDescription';
import cli from '@battis/qui-cli';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO deal with _deleted_ files

function merge(
  prev: FolderDescription | FileDescription,
  next: FolderDescription
): FolderDescription {
  if (isFileDescription(prev)) {
    return next;
  }
  const merged = next;
  for (const filename of Object.keys(next)) {
    const prevFile = prev[filename];
    const nextFile = next[filename];
    if (isFileDescription(nextFile)) {
      if (isFileDescription(prevFile) && prevFile.index) {
        merged[filename].index = prevFile.index;
      }
    } else {
      merged[filename] = merge(prevFile, nextFile);
    }
  }
  return merged;
}

(async () => {
  const { positionals } = cli.init({
    env: {
      root: path.join(__dirname, '../..'),
      loadDotEnv: path.join(__dirname, '../../.env')
    },
    args: { requirePositionals: 1 }
  });
  const filePath = positionals[0].toString();
  const spinner = cli.spinner();
  spinner.start(`Loading index from ${cli.colors.url(filePath)}`);
  const prevTree: FolderDescription = JSON.parse(
    fs.readFileSync(filePath).toString()
  ) as FolderDescription;
  const prevName = Object.keys(prevTree)[0];
  spinner.succeed(`${cli.colors.value(prevName)} index loaded`);

  spinner.start('Indexing');
  const nextTree = await buildTree(
    (prevTree[prevName] as FolderDescription)['.'].id!,
    spinner
  );
  const nextName = Object.keys(nextTree)[0];
  spinner.succeed(`Indexed ${nextName}`);

  spinner.start(`Writing index to ${cli.colors.url(filePath)}`);
  nextTree[nextName] = merge(
    prevTree[prevName],
    nextTree[nextName] as FolderDescription
  );

  fs.writeFileSync(
    positionals[0].toString(),
    JSON.stringify(nextTree, null, 2)
  );

  spinner.succeed(filePath);
})();
