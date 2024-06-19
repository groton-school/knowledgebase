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
  require('dotenv').config({ path: process.cwd() });

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
      
// embed a published Google Doc
// ${
        process.env.STYLIZE_URL
      }/?edit=true&head=%3Cscript+src%3D%22https%3A%2F%2Fcdnjs.cloudflare.com%2Fajax%2Flibs%2Frequire.js%2F2.3.6%2Frequire.min.js%22+integrity%3D%22sha512-c3Nl8%2B7g4LMSTdrm621y7kf9v3SDPnhxLNhcjFJbKECVnmZHTdo%2BIRO05sNLTH%2FD3vA6u1X32ehoLC7WFVdheg%3D%3D%22+crossorigin%3D%22anonymous%22+referrerpolicy%3D%22no-referrer%22%3E%3C%2Fscript%3E&style=%23banners%2C+.doc-content+%3E+div%3Afirst-child%2C+.title+%7B%0A++display%3A+none%3B%0A%7D%0A%0A%23contents+%7B%0A++padding%3A+0%3B%0A%7D%0A%0A.doc-content+%7B%0A++padding%3A+1em+%21important%3B%0A%7D&script=requirejs%28%5B%27https%3A%2F%2Fstorage.googleapis.com%2Fkb-groton-org%2Fbuild%2Fkb-${
        pkg.version
      }.js%27%5D%29

`
    );
  }

  uploadDirectory().catch(console.error);
})();
