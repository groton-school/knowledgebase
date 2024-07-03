import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import nodeExternals from 'rollup-plugin-node-externals';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'build',
    format: 'cjs',
    plugins: [terser()]
  },
  plugins: [
    del({ targets: 'build/*' }),
    nodeExternals(),
    typescript(),
    copy({
      targets: [{ src: '../ui/build', dest: '.' }]
    })
  ]
};
