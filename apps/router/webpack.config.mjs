import bundle from '@battis/webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import nodeExternals from 'webpack-node-externals';

const config = bundle.fromTS.toVanillaJS({
  root: import.meta.dirname,
  target: 'node',
  externals: [nodeExternals({ allowlist: [/^@groton\/knowledgebase\..*/] })],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: '../ui/build', to: '' }]
    })
  ],
  production: true
});

export default config;
