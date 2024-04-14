const vanilla = require('@battis/webpack/ts/vanilla');

const config = vanilla({
  root: __dirname
});

/*
config.resolve.fallback = {
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  zlib: require.resolve('browserify-zlib'),
  querystring: require.resolve('querystring-es3'),
  path: require.resolve('path-browserify'),
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  assert: require.resolve('assert/'),
  util: require.resolve('util/'),
  url: require.resolve('url/'),
  os: require.resolve('os-browserify/browser')
};
*/
/*
    "https-browserify": "^1.0.0",
"assert": "^2.1.0",
"browserify-zlib": "^0.2.0",
"crypto-browserify": "^3.12.0",
"os-browserify": "^0.3.0",
"path-browserify": "^1.0.1",
"querystring-es3": "^0.2.1",
"stream-browserify": "^3.0.0",
"stream-http": "^3.2.0",
"url": "^0.11.3",
"util": "^0.12.5"
*/
module.exports = config;
