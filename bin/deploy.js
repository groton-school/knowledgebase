#!/usr/bin/env node
// assumes Application Default Credentials configured
// https://cloud.google.com/docs/authentication/provide-credentials-adc#local-dev

'use strict';
(async () => {
  const { Storage } = require('@google-cloud/storage');

  // Creates a client
  const storage = new Storage({ projectId: process.env.PROJECT });

  const { promisify } = require('util');
  const fs = require('fs');
  const path = require('path');

  const readdir = promisify(fs.readdir);
  const stat = promisify(fs.stat);

  const pkg = require('../package.json');
  const webpack = require('../webpack.config');
  require('dotenv').config();

  const bucketName = process.env.BUCKET_NAME;
  const directoryPath = webpack.output.path;

  async function* getFiles(directory = '.') {
    for (const file of await readdir(directory)) {
      const fullPath = path.join(directory, file);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        yield* getFiles(fullPath);
      }

      if (stats.isFile()) {
        yield fullPath;
      }
    }
  }

  async function uploadDirectory() {
    const bucket = storage.bucket(bucketName);
    let successfulUploads = 0;

    for await (const filePath of getFiles(directoryPath)) {
      try {
        const dirname = path.dirname(directoryPath);
        const destination = path.relative(
          dirname,
          filePath.replace(/kb\.[^.]+\.([cj]ss?)$/, `kb-${pkg.version}.$1`)
        );

        await bucket.upload(filePath, { destination });

        console.log(`Successfully uploaded: ${filePath} => ${destination}`);
        successfulUploads++;
      } catch (e) {
        console.error(`Error uploading ${filePath}:`, e);
      }
    }

    console.log(
      `${successfulUploads} files uploaded to ${bucketName} successfully.`
    );
    console.log(
      `

Paste the following JavaScript into Site Settings/Developers/JS:

// production
requirejs([\`https://${path.join(
        'storage.googleapis.com',
        bucketName,
        path.relative(process.cwd(), directoryPath),
        `kb-${pkg.version}.js`
      )}\`]);

// development (disable GSC caching)
// requirejs([\`https://${path.join(
        'storage.googleapis.com',
        bucketName,
        path.relative(process.cwd(), directoryPath),
        `kb-${pkg.version}.js?cache=\${crypto.randomUUID()}`
      )}\`]);

`
    );
  }

  uploadDirectory().catch(console.error);
})();
