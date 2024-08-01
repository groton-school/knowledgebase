# @groton/knowledgebase.ui

Front end UI to add functionality to published static Google Drive document HTML

# Install

For now, follow steps for [installing the monorepo]('../..#install').

# Configure

This app can be configured throughout the code, in particular... (And yes, clearly, this should be consolidated in some meaningful way.)

##### `.env`

Set `DEBUGGING=true` for debugging information in the bundle build (and much larger bundle size).

##### [`src/Constants.scss`](./src/Constants.scss)

Toolbar color (`$grotonRed`) and class selector prefixes

##### [`src/Embed/Hyperlinks/index.ts`](./src/Embed/Hyperlinks/index.ts)

Which links become embeds.

##### [`src/UI/index.ts`](./src/UI/index.ts)

Which UI tweaks are applied.

##### [`src/UI/LinkLabelByGroup/styles.scss`](./src/UI/LinkLabelByGroup/styles.scss)

Which URLs get tagged with labels (and have their titles shortened). Entered as an [Sass list](https://sass-lang.com/documentation/values/lists/) of lists:

```scss
$groups: 'for-teachers/' 'Faculty', 'for-students/' 'Students' white
    Constants.$grotonRed, 'for-staff/' 'Staff', 'for-employees/'
    'Faculty & Staff', 'for-department-heads/' 'Dept. Heads', 'for-it/' 'IT'
    gold black;
```

In general, for each label definition list:

- Item 1 is a string defining the end of the HREF path to match on (i.e. "every HREF that ends in `for-it/")
- Item 2 is the text content of the label (i.e. `IT`)
- Item 3, if defined, is the color of the label badge. If not defined, it defaults to the color of the navbar, as defined in [`src/Constants.scss`](./src/Constants.scss) and referred to as `$grotonRed` (i.e. `gold`)
- Item 4, if defined, is the color of the text and badge border. If not defined, it defaults to white. Note that if this color is defined, Item 3, the badge color, must _also_ be defined/

##### [`src/UI/TitleCaseAllCapsHeaders.ts`](./src/UI/TitleCaseAllCapsHeaders.ts)

Which words and phrases are capitalized in headers. Phrases are entered with non-breaking spaces as in `Apple ID` (option-space on macOS). The phrases then need to be typed in Google Docs with that non-breaking space as well!

##### [`src/UI/TOC/index.ts`](./src/UI/TOC/index.ts)

How many header levels to include in the generated table of contents. (`MAX_DEPTH` value)

# Deploy

This app can be be built and deployed either as part of [`router`]('../router#deploy') or independently. The Javascript and CSS bundles (`build/kb.js` and `build/kb.css`) can be built on their own and hosted wherever is convenient, and then inserted into a published Google Doc using a tool like [stylize](https://github.com/battis/stylize).

To build the bundles:

```sh
pnpm -F @groton/knowledgebase.ui run build
```

To deploy the updated `ui` as part of the `router` (using the latest `ui` build):

```sh
pnpm -F @groton/knowledgebase.router run deploy
```
