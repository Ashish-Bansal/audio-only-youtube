const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname);
const argv = require('yargs').argv;

const paths = {
  package: path.join(root, 'package.json'),
  manifest: path.join(root, 'manifest.json'),
  dist: path.join(root, 'dist'),
  distManifest: path.join(root, 'dist', 'manifest.json'),
};

function createManifest(log) {
  let manifest = JSON.parse(fs.readFileSync(paths.manifest, 'utf8'));
  let pkg = JSON.parse(fs.readFileSync(paths.package, 'utf8'));

  manifest.name = pkg.displayName;
  manifest.version = pkg.version;
  manifest.description = pkg.description;

  fs.writeFileSync(paths.distManifest, JSON.stringify(manifest));
  if (log) console.info('manifest: created');
}

function watchOut(something, callback, log) {
  fs.watchFile(something, () => {
    if (callback) callback();
    if (log) console.info(`${something}: updated`);
  });
}

if (!fs.existsSync(paths.dist)){
  fs.mkdirSync(paths.dist);
}

createManifest(true);

if (argv.watch) {
  watchOut(paths.manifest, createManifest, true);
  watchOut(paths.package, createManifest, true);
}
