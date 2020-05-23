const _ = require('lodash');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fillUpManifest = require('./fill-up-manifest');
const config = require('./config.js');

module.exports = _.merge({}, config, {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, '../build/dev'),
  },
  devtool: 'source-map',
  plugins: [
    new CopyWebpackPlugin([{ from: './src' }], {
      ignore: ['js/**/*', 'manifest.json'],
      copyUnmodified: false,
    }),
    new CopyWebpackPlugin([
      {
        from: './src/manifest.json',
        transform(content) {
          return fillUpManifest(content);
        },
      },
    ]),
  ],
  watch: true,
});
