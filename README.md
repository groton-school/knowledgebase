# @groton/knowledgebase

Knowledgebase website

While written specifically to facilitate our school knowledgebase, this is a monorepo that contains three separate apps that (can, theoretically) all operate independently of each other:

- [`indexer`](./apps/indexer) scans a Google Drive folder, builds an index of the files and file permissions in that folder, and syncs the files in the Google Drive folder to a Google Cloud Storage bucket as either their static HTML versions (Google Docs, Sheets, Slides, etc.) or the native files (PDF, PNG, etc.), setting the access permissions on the Cloud Storage items to match the Google Drive permissions.
- [`router`](./apps/router) runs on Google App Engine and serves up a website hosted in Google Cloud Storage, mapping the user request path to paths in Google Cloud storage, with users authenticated to the site via OAuth 2.0.
- [`ui`](./apps/ui) is a front end script that parses the static HTML of a published Google Doc and enhances the UI in a variety of ways: build a table of contents, change links to embeds, standardize formatting, make images zoomable, etc. At present, it is a bit more tightly tied to `router` than maybe it should be (it also adds a navbar and search).

# Dependencies

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Python](https://www.python.org/) -- for log tailing only

# Install

1. Clone this repo:

```sh
git clone git@github.com:groton-school/knowledgebase.git path/to/repo
```

2. Install dependencies:

```sh
cd path/to/repo
pnpm install
```

3. [Create a new Google Cloud Project](https://console.cloud.google.com/projectcreate) -- make a note of the project ID (e.g. `egregious-juniper-123456` or similar). While the setup script (below) _can_ create a new project for you, it _cannot_ configure OAuth consent...
4. [Configure OAuth Consent for that project](https://console.cloud.google.com/apis/credentials/consent)
5. Run the setup script, answering questions reasonably (starting with the project ID):

```sh
cd path/to/repo
pnpm run setup
```

# Configure

There are a number of places where configuration can be performed. Refer to the individual apps for for more information.

- [Configure `indexer`](./apps/indexer#configure)
- [Configure `router`](./apps/router#configure)
- [Configure `ui`](./apps/ui#configure)

# Deploy & Sync

The site is initially synced and deployed for the first time as part of the installation process in the setup script.

To resync changes from the Google Drive folder to the site:

```sh
cd path/to/repo
pnpm run sync
```
