import CopyWebpackPlugin from 'copy-webpack-plugin';
import fs from 'node:fs';
import path from 'node:path';
import nodeExternals from 'webpack-node-externals';
import YAML from 'yaml';

const gae = YAML.parse(
  fs.readFileSync(path.join(import.meta.dirname, 'app.yaml')).toString()
);

function ignoreInvisible(filePath) {
  return !/^\./.test(path.basename(filePath));
}

const config = {
  mode: 'production',
  target: gae.runtime.replace('nodejs', 'node'),
  entry: path.join(import.meta.dirname, 'tmp_tsc/index.js'),
  output: {
    path: path.join(import.meta.dirname, 'build'),
    filename: '[name].cjs',
    clean: true
  },
  externalsPresets: { node: true },
  externals: [
    nodeExternals({
      allowlist: [/^@groton\/knowledgebase\..*/]
    })
  ],
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './node_modules/@groton/knowledgebase.ui/build',
          to: '',
          filter: ignoreInvisible
        },
        {
          from: './node_modules/@groton/knowledgebase.indexer/dist',
          to: '../var',
          filter: ignoreInvisible
        }
      ]
    })
  ],
  optimization: { minimize: true }
};

export default config;
