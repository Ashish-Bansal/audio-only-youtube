const path = require('path');

module.exports = {
  entry: {
    'content-script': './src/js/content-script.ts',
    background: './src/js/background.ts',
    options: './src/js/options.ts',
  },
  output: {
    filename: './js/[name].js',
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
    ],
  },
};
