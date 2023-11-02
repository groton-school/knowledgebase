require('dotenv').config();

const DEBUGGING = JSON.parse(process.env.DEBUGGING);
if (DEBUGGING) {
  console.log('DEBUGGING enabled, compiling in development mode');
}

module.exports = require('@battis/webpack/ts/vanilla')({
  root: __dirname,
  bundle: 'kb',
  mode: DEBUGGING ? 'development' : 'production',
  externals: { requirejs: 'requirejs' }, // reuse Overdrive dependencies
  production: !JSON.parse(process.env.DEBUGGING)
});
