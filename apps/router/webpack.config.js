const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = require('@battis/webpack/ts/vanilla')({
  root: __dirname,
  production: false,
  target: 'node',
  externals: [nodeExternals({allowlist: [/^@groton\/knowledgebase\..*/]})],
  filename: 'index',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: '../ui/build', to: '' }]
    })
  ]
});
