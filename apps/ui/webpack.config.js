require('dotenv').config();
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const cfg = require('./var/config.json');

const DEBUGGING = JSON.parse(process.env.DEBUGGING);
if (DEBUGGING) {
  console.log('DEBUGGING enabled, compiling in development mode');
}

const config = require('@battis/webpack/ts/vanilla')({
  root: __dirname,
  bundle: 'ui',
  filename: 'assets/[name]',
  mode: DEBUGGING ? 'development' : 'production',
  plugins: [
    new CleanWebpackPlugin(),
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

module.exports = config;
