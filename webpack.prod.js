const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = merge(common, {
  mode: 'production',

  module: {
    rules: [
      // Proses file CSS untuk production dengan MiniCssExtractPlugin
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      // Proses JavaScript dengan Babel untuk kompatibilitas
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new CleanWebpackPlugin(),  // Bersihkan dist/ sebelum build
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
  performance: {
    hints: 'warning', // Tetap tampilkan warning, tapi naikkan limit
    maxAssetSize: 512000, // Naikkan limit aset menjadi 500 KiB (dari 244 KiB)
    maxEntrypointSize: 512000, // Naikkan limit entry point menjadi 500 KiB
  },
});
