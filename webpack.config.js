module.exports = require('@battis/webpack/ts/vanilla')({
  root: __dirname,
  bundle: 'kb',
  externals: { requirejs: 'requirejs', jQuery: '$' } // reuse Overdrive dependencies
});
