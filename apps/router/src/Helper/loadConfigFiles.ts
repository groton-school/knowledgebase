import { Config, Groups, Index, Keys } from '@groton/knowledgebase.config';
import fs from 'node:fs/promises';
import path from 'node:path';

type Configs = [Keys, Config.Config, Groups, Index];

export async function loadConfigFiles(): Promise<Configs> {
  return (
    await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'var/keys.json')),
      fs.readFile(path.resolve(process.cwd(), 'var/config.json')),
      fs.readFile(path.resolve(process.cwd(), 'var/groups.json')),
      fs.readFile(path.resolve(process.cwd(), 'var/index.json'))
    ])
  ).map((response) => JSON.parse(response.toString())) as Configs;
}
