# @groton.knowledgebase.indexer

Index and sync Google Drive Folder to Google Cloud Storage bucket as static HTML

# Install

For now, follow steps for [installing the monorepo]('../..#install'), including especially storing the web application OAuth 2.0 credentials in `var/keys.json`

# Configure

This repo contains a collection of scripts in the [`bin`](./bin) directory. The scripts can be run using `tsx`, e.g.:

```sh
npx tsx bin/index.ts
```

In general, each script has a `--help` (or `-h`) flag for more information:

```sh
npx tsx bin/index.s --help
```

After the script has authenticated to Google, the API access tokens are stored in 'var/tokens.json'

# Use

This has been built to work closely with [`router`](../apps/router) and [`ui`](../apps/ui).

1.  `npx tsx bin/index.ts` builds a new index of a Google Drive folder and/or updates an existing Google Drive folder index, depending on arguments passed. By default, it works with the index file at `../router/var/index.json` and uses the environment variables stored at `../../.env`
2.  `npx tsx bin/groups.ts` builds a new list of relevant groups (used to manage Google Drive permissions and thus Google Cloud Storage ACLs). By default, it generates to `../router/var/groups.json` and uses the environment variables stored at `../../.env`
3.  `npx tsx bin/upload.ts` uploads any newly-indexed (per the index file) files to Google Cloud storage, updateing the index file on completion. By default, it reads and updates `../router/var/index.json` and uses the environment variables stored at `../../.env`
4.  `npx tsx bin/reset-permissions.ts` resets the Google Cloud Storage ACLs on all indexed files to match the indexed Google Drive permissions. By default, it reads from `../router/var/index.json` and uses the environment variables stored at `../../.env`

In practice, these scripts are bundled together into a single command in the package, using default values:

```sh
pnpm -F @groton/knowledgebase.indexer run upload
```
