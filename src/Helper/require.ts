
const requirejs = require('requirejs');

export default function libRequire(paths: string[], callback?: () => any) {
  const head = document.querySelector('head') as HTMLHeadElement;
  paths
    .filter((path) => /\.css$/.test(path))
    .forEach((path) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = path;
      head.append(link);
    });
  requirejs(
    paths.filter((path) => /\.js$/.test(path)),
    callback
  );
}
