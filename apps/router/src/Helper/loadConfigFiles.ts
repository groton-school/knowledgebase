import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Config, Groups, Index, Keys } from '@groton/knowledgebase.config';
import fs from 'node:fs/promises';
import path from 'node:path';

type Configs = [Keys, Config.Config, Groups, Index];

export async function loadConfigFiles(): Promise<Configs> {
  return (await Promise.all([
    (async () => {
      const client = new SecretManagerServiceClient();
      const [response] = await client.accessSecretVersion({
        name: 'GOOGLE_API_KEYS'
      });
      if (!response.payload?.data) {
        throw new Error();
      }
      return JSON.parse(response.payload?.data?.toString());
    })(),
    ...['config.json', 'groups.json', 'index.json'].map(async (filename) =>
      JSON.parse(
        await fs
          .readFile(path.resolve(process.cwd(), `build/data/${filename}`))
          .toString()
      )
    )
  ])) as Configs;
}
