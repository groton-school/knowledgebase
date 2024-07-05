import { Var } from '../var';
import fs from 'fs/promises';
import path from 'path';

type Configs = [Var.Keys, Var.Config, Var.Groups, Var.Index];

export default async function loadConfigFiles(): Promise<Configs> {
  return (
    await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'var/keys.json')),
      fs.readFile(path.resolve(process.cwd(), 'var/config.json')),
      fs.readFile(path.resolve(process.cwd(), 'var/groups.json')),
      fs.readFile(path.resolve(process.cwd(), 'var/index.json'))
    ])
  ).map((response) => JSON.parse(response.toString())) as Configs;
}
