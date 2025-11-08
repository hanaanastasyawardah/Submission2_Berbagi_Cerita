const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Path absolut ke src/public/index.html
const TEMPLATE_ABS = path.resolve(__dirname, 'src/public/index.html');

// LOG DI KONSOL UNTUK MEMASTIKAN PATH YANG DITANGANI OLEH WEBPACK
console.log('>> USING CONFIG     :', __filename);
console.log('>> EXPECTED TEMPLATE:', TEMPLATE_ABS);
console.log('>> TEMPLATE EXISTS? :', fs.existsSync(TEMPLATE_ABS));

// Jika file src/public/index.html ada, pakai template biasa, jika tidak ada fallback
const useTemplateFile = fs.existsSync(TEMPLATE_ABS);

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
  },

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: false, // dibersihkan di CleanWebpackPlugin (prod)
  },

  module: {
    rules: [
      // untuk gambar & ikon
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin(
      useTemplateFile
        ? {
            // JALUR NORMAL — PAKAI FILE TEMPLATE
            template: TEMPLATE_ABS,
            filename: 'index.html',
          }
        : {
            // FALLBACK — kalau file tidak ditemukan, generate HTML minimal
            filename: 'index.html',
            templateContent: `
              <!doctype html>
              <html lang="id">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>Berbagi Cerita (Fallback)</title>
              </head>
              <body>
                <div id="app"></div>
                <noscript>Enable JavaScript to run this app.</noscript>
              </body>
              </html>
            `,
          }
    ),

    // Salin SEMUA isi public/ → dist/ (kecuali index.html karena dihandle HWP)
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'dist/'),
          globOptions: { ignore: ['**/index.html'] },
          noErrorOnMissing: true, // kalau folder kosong/ga ada, jangan gagal
        },
      ],
    }),
  ],
};
