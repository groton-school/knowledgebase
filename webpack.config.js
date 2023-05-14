const config = require('@battis/webpack/ts/vanilla');

module.exports = config({
  root: __dirname,
  bundle: 'kb',
  terserOptions: {
    terserOptions: {
      mangle: { properties: true }
    }
  }
});
