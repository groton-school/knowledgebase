import CopyPlugin from 'copy-webpack-plugin';
import path from 'node:path';
import nodeExternals from 'webpack-node-externals';

export default {
  mode: 'production',
  entry: {
    main: path.resolve(import.meta.dirname, 'src/index.ts')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(import.meta.dirname, 'build'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts'],
    extensionAlias: {
      '.js': ['.js', '.ts']
    }
  },
  externalsPresets: { node: true },
  externals: [nodeExternals({ allowlist: [/^@groton\/knowledgebase\..*/] })],
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(
            import.meta.dirname,
            'node_modules/@groton/knowledgebase.ui/build'
          )
        },
        {
          from: path.resolve(
            import.meta.dirname,
            'node_modules/@groton/knowledgebase.indexer/dist'
          ),
          to: 'data'
        },
        {
          from: path.resolve(import.meta.dirname, 'var'),
          to: 'data'
        }
      ]
    })
  ]
};
