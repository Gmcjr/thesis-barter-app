const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const client = path.resolve(__dirname, 'client');

require('dotenv').config({ path: path.join('config', '.env') });

module.exports = {
  entry: path.join(client, 'src', 'index.jsx'),
  output: {
    path: path.join(client, 'dist'),
    filename: 'bundle.js',
  },
  mode: process.env.MODE,
  watch: process.env.MODE === 'development',
  module: {
    roles: [
      {
        test: /\.?jsx?$/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: path.join(client, 'src', 'index.html') })],
}
