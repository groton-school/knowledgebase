import { Config, Groups, Index, Keys } from '@groton/knowledgebase.config';
import fs from 'node:fs/promises';
import path from 'node:path';

type Configs = [Keys, Config.Config, Groups, Index];

export async function loadConfigFiles(): Promise<Configs> {
  return (
    await Promise.all(
      ['keys.json', 'config.json', 'groups.json', 'index.json'].map(
        (filename) =>
          fs.readFile(path.resolve(process.cwd(), `build/data/${filename}`))
      )
    )
  ).map((response) => JSON.parse(response.toString())) as Configs;
}
