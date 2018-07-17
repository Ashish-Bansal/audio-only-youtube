const path = require('path');

module.exports = {
  entry: {
    'content-script': './src/ts/content-script',
    background: './src/ts/background',
    options: './src/ts/options',
  },
  output: {
    filename: './js/[name].js',
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader', 'babel-loader'],
        include: path.resolve(__dirname, '../src/ts'),
      },
    ],
  },
};
