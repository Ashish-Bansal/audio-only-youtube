const pkg = require('../package.json');

module.exports = (content) => {
  content = content.toString();
  content = content.replace('$DISPLAY_NAME', pkg.displayName);
  content = content.replace('$VERSION', pkg.version);
  content = content.replace('$DESCRIPTION', pkg.description);
  return content;
};
