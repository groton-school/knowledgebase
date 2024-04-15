import FileDescription from './FileDescription';
import authorize from './authorize';
import cli from '@battis/qui-cli';
import { Storage } from '@google-cloud/storage';

type Configuration = {
  file: FileDescription;
  bucketName: string;
  spinner?: ReturnType<typeof cli.spinner>;
  fileRenamer?: (fileName: string) => string;
  fileMutator?: (fileContents: string) => string;
  entityFilter?: (entity: string) => boolean;
};

async function uploadToBucket({
  file,
  bucketName,
  spinner,
  fileRenamer = (fileName: string) =>
    fileName.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
  fileMutator = (fileContents) => fileContents,
  entityFilter = () => true
}: Configuration) {
  spinner?.start(
    `Uploading ${cli.colors.value(file.name)} to ${cli.colors.url(bucketName)}`
  );
  const oauth = await authorize(spinner);
  const html = fileMutator(
    await (
      await fetch(
        `https://docs.google.com/document/u/0/export?format=html&id=${file.id}`,
        {
          headers: {
            Authorize: `Bearer ${(await oauth.getAccessToken()).token}`
          }
        }
      )
    ).text()
  );

  // storage authorization via process.env.GOOGLE_APPLICATION_CREDENTIALS
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const remoteFile = bucket.file(fileRenamer(file.name));
  await remoteFile.save(Buffer.from(html));
  for (const entity of file.access.filter(entityFilter)) {
    spinner?.start(`${spinner.text} (${entity})`);
    await remoteFile.acl.readers.addGroup(entity);
  }
  spinner?.succeed(cli.colors.value(file.name));
}

export default uploadToBucket;
