const path = require('path');

module.exports = {
  entry: './app/scripts/foreground.js',
  output: {
    path: path.resolve(__dirname, 'webpacket'),
    filename: 'jobassistant-webpack.bundle.js'
  },
};