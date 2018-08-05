const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname);
const argv = require('yargs').argv;

const dir = {
  package: path.join(root, 'package.json'),
  manifest: path.join(root, 'manifest.json'),
  dist: path.join(root, 'dist'),
  distManifest: path.join(root, 'dist', 'manifest.json'),
};

function createManifest(log) {
  let manifest = JSON.parse(fs.readFileSync(dir.manifest, 'utf8'));
  let pkg = JSON.parse(fs.readFileSync(dir.package, 'utf8'));

  manifest.name = pkg.displayName;
  manifest.version = pkg.version;
  manifest.description = pkg.description;

  fs.writeFileSync(dir.distManifest, JSON.stringify(manifest));
  if (log) console.info('manifest: created');
}

function watchOut(something, callback, log) {
  fs.watchFile(something, () => {
    if (callback) callback();
    if (log) console.info(`${something}: updated`);
  });
}

if (!fs.existsSync(dir.dist)){
  fs.mkdirSync(dir.dist);
}

createManifest(true);

if (argv.watch) {
  watchOut(dir.manifest, createManifest, true);
  watchOut(dir.package, createManifest, true);
}
