const requirejs = require('requirejs');

/**
 * Import external JavaScript or CSS file to the DOM
 *
 * Reuses `RequireJS` dependency of Overdrive to import JavaScript files
 * (externalized by `webpack.config.js`) and adds a link element to the
 * document head for CSS files.
 *
 * @see https://requirejs.org/
 *
 * @param {string[]} paths Paths of files to be imported
 * @param {Function} callback (Optional) callback function when files have
 *     been imported
 */
export default function libRequire(paths: string[], callback?: () => any) {
  const head = document.querySelector('head') as HTMLHeadElement;
  paths
    .filter((path) => /\.css(\?.*)?$/.test(path))
    .forEach((path) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = path;
      head.append(link);
    });
  requirejs(
    paths.filter((path) => /\.js(\?.*)?$/.test(path)),
    callback
  );
}
