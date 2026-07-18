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
  // cache: process.env.MODE === 'development' ? { type: 'filesystem' } : false,
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
          },
        },
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: path.join(client, 'src', 'index.html') })],
}
