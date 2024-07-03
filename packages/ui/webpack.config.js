require('dotenv').config();
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const DEBUGGING = JSON.parse(process.env.DEBUGGING);
if (DEBUGGING) {
  console.log('DEBUGGING enabled, compiling in development mode');
}

module.exports = require('@battis/webpack/ts/vanilla')({
  root: __dirname,
  bundle: 'kb',
  filename: 'assets/[name]',
  mode: DEBUGGING ? 'development' : 'production',
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
        { from: 'public', to: '' }
      ]
    })
  ],
  production: !JSON.parse(process.env.DEBUGGING)
});
