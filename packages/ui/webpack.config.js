require('dotenv').config();
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const DEBUGGING = JSON.parse(process.env.DEBUGGING);
if (DEBUGGING) {
  console.log('DEBUGGING enabled, compiling in development mode');
}

const build = path.join(__dirname, '../server/build');

module.exports = require('@battis/webpack/ts/vanilla')({
  root: __dirname,
  bundle: 'kb',
  filename: 'assets/[name]',
  build,
  mode: DEBUGGING ? 'development' : 'production',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'assets', to: path.join(build, 'assets') }]
    })
  ],
  externals: { requirejs: 'requirejs' }, // reuse Overdrive dependencies
  production: !JSON.parse(process.env.DEBUGGING)
});
