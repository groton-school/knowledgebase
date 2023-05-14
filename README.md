# @groton/knowledgebase

Configuration and scripting for Overdrive.io integration

## Use

Assumes `git`, `npm` (i.e. Node.js), and `pnpm` are installed. (`npm` can be used instead of `pnpm`, if preferred.)

```bash
git clone git@github.com:groton-school/knowledgebase.git
cd knowledgebase
pnpm i
cp .env.example .env
```

Update `./.env` to contain correct values

```
npm run build
```

In Site Settings > Developer, paste the contents of `./build/kb.[contenthash].js` into the JS field and the contents of `./build/kb.[contenthash].css` into the CSS field and click Save.
