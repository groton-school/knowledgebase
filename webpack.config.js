module.exports = require('@battis/webpack/ts/vanilla')({
  root: __dirname,
  bundle: 'kb',
  externals: { qrcode: 'QRCode' }
});
