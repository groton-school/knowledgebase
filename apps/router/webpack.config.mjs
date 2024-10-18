import bundle from '@battis/webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import nodeExternals from 'webpack-node-externals';

const config = bundle.fromTS.toVanillaJS({
  root: import.meta.dirname,
  bundle: 'index',
  output: { filename: '[name]' },
  target: 'node',
  externals: [nodeExternals({ allowlist: [/^@groton\/knowledgebase\..*/] })],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: '../ui/build', to: '' }]
    })
  ],
  optimization: { minimize: false },
  production: true
});

config.externalsPresets = { node: true };

export default config;
