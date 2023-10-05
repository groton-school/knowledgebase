require('dotenv').config();

module.exports = require('@battis/webpack/ts/vanilla')({
  root: __dirname,
  bundle: 'kb',
  mode: JSON.parse(process.env.DEBUGGING) ? 'development' : 'production',
  externals: { requirejs: 'requirejs' } // reuse Overdrive dependencies
});
