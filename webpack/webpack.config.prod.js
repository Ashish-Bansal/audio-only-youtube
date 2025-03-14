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
    new CopyWebpackPlugin(
      {
        patterns: [
          {
            from: './src',
            globOptions: {
              ignore: ['js/**/*', 'manifest.json'],
            },
            transform(content, filepath) {
              if (filepath.indexOf("manifest.json") > -1) {
                return fillUpManifest(content);
              }
              return content;
            }
          },
        ],
      }
    ),
    new ZipPlugin({
      filename: appName,
    }),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }),
  ],
  target: 'web',
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/"),
      "string_decoder": require.resolve("string_decoder/"),
      "timers": require.resolve("timers-browserify"),
      "stream": require.resolve("stream-browserify"),
      "querystring": require.resolve("querystring-es3"),
    }
  }
});
