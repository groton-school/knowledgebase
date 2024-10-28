import bundle from '@battis/webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import dotenv from 'dotenv';
import webpack from 'webpack';
import pkg from './package.json' with { type: 'json' };
import cfg from './var/config.json' with { type: 'json' };

dotenv.config();
const DEBUGGING = JSON.parse(process.env.DEBUGGING);
let LOCAL_STATIC_FILES = false;
if (DEBUGGING) {
  console.log('DEBUGGING enabled, compiling in development mode');
  LOCAL_STATIC_FILES = JSON.parse(process.env.LOCAL_STATIC_FILES);
  if (LOCAL_STATIC_FILES) {
    console.log('LOCAL_STATIC_FILES enabled, including static files in build');
  }
}

const config = bundle.fromTS.toVanillaJS({
  root: import.meta.dirname,
  bundle: 'ui',
  output: {
    filename: 'assets/[name]'
  },
  externals: 'gtag',
  plugins: [
    new webpack.DefinePlugin({
      __PKG_NAME__: JSON.stringify(pkg.name),
      __PKG_VERSION__: JSON.stringify(pkg.version)
    }),
    new CopyWebpackPlugin({
      patterns: LOCAL_STATIC_FILES
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
