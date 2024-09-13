import bundle from '@battis/webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import dotenv from 'dotenv';

dotenv.config();
const DEBUGGING = JSON.parse(process.env.DEBUGGING);
if (DEBUGGING) {
  console.log('DEBUGGING enabled, compiling in development mode');
}

const config = bundle.fromTS.toVanillaJS({
  root: import.meta.dirname,
  bundle: 'ui',
  output: {
    filename: 'assets/[name]'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: DEBUGGING
        ? [
            { from: 'assets', to: 'assets' },
            { from: 'public', to: '' }
          ]
        : [{ from: 'assets', to: 'assets' }]
    })
  ],
  production: !DEBUGGING
});

// do not resolve unresolvable URLs!
const rule = config.module.rules.findIndex((rule) => rule.test.test('.scss'));
const loader = config.module.rules[rule].use.findIndex(
  (use) => use.loader == 'css-loader'
);
config.module.rules[rule].use[loader].options.url = {
  filter: (url) =>
    cfg.ui.webpack.doNotResolve.reduce(
      (resolve, dnr) => resolve && !url.startsWith(dnr),
      true
    )
};

// ignore Bootstrap's SCSS
config.ignoreWarnings = [
  (warning) => /\/node_modules\/bootstrap\/scss\//.test(warning.warning)
];

export default config;
