const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },

  devServer: {
    // Serve folder public dan dist agar file statis seperti gambar atau ikon bisa terbaca
    static: [
      path.resolve(__dirname, 'src/public'),  // folder public dari src
      path.resolve(__dirname, 'dist'),        // folder dist untuk hasil build
    ],
    port: 9000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
    compress: true,
    historyApiFallback: true,  // Enable this if you're using React Router (SPA)
    hot: true,
    open: false, // Auto open browser on start
  },

  devtool: 'eval-source-map', // For easier debugging in development
});
