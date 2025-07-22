import { JSONObject } from '@battis/typescript-tricks';
import fs from 'node:fs';
import { File } from './File.js';
import { FileFactory } from './FileFactory.js';
import { Index } from './Index_.js';

export class IndexFactory<F extends typeof File> {
  public constructor(private fileType: F) {}

  public async fromFile(
    filePath: string,
    permissionsRegex?: RegExp
  ): Promise<Index<InstanceType<F>>> {
    const fileFactory = new FileFactory(this.fileType);
    const obj = JSON.parse(fs.readFileSync(filePath).toString());
    if (Array.isArray(obj)) {
      return new Index<InstanceType<F>>(
        ...(
          await Promise.allSettled(
            obj.map(async (e: JSONObject) => {
              return await fileFactory.fromDrive(e, permissionsRegex);
            })
          )
        ).reduce((all, result) => {
          if (result.status === 'fulfilled') {
            all.push(result.value);
          }
          return all;
        }, [] as InstanceType<F>[])
      );
    }
    return new Index<InstanceType<F>>(...[]);
  }
}
