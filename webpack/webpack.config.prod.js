const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');

const config = require('./config.js');
const pkg = require('../package.json');
const fillUpManifest = require('./fill-up-manifest');
const appName = `${pkg.name}-${pkg.version}`;

module.exports = _.merge({}, config, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../build/prod'),
  },
  plugins: [
    new CopyWebpackPlugin([{ from: './src' }], {
      ignore: ['js/**/*', 'manifest.json'],
      copyUnmodified: true,
    }),
    new CopyWebpackPlugin([
      {
        from: './src/manifest.json',
        transform(content) {
          return fillUpManifest(content);
        },
      },
    ]),
    new ZipPlugin({
      filename: appName,
    }),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }),
  ],
});
