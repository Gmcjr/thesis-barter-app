import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join('config', '.env') });

const client = path.resolve(__dirname, 'client');

export default {
  entry: path.join(client, 'src', 'index.tsx'),
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
              '@babel/preset-typescript',
            ],
          },
        },
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: path.join(client, 'src', 'index.html') })],
};
