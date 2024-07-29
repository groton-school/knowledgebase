# @groton/knowledgebase

Configuration and scripting for Overdrive.io integration

## Prequisites

Assumes `git`, `gcloud`, `npm` (i.e. Node.js), and `pnpm` are installed. (`npm` can be used instead of `pnpm`, if preferred.)

## Install

```bash
git clone git@github.com:groton-school/knowledgebase.git
cd knowledgebase
pnpm i
cp .env.example .env
```

Update `./.env` to contain correct values

## Deploy

```
npm run build
```

Create a bucket in Google Cloud Storage with public access.

Authenticate `gcloud` if necessary (a user with access to the bucket specified in `.env` is required)

```
npm run deploy
```

Copy the snippet of `requirejs` JavaScript code that deploy gives you into the JS field of the Develpers pane of Site Settings.

Subsequent runs of `deploy` will update this file, with no changes necessary in OverDrive until the version number of the package changes.
