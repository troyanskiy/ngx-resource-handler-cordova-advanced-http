/**
 * Adapted from angular2-webpack-starter
 */

const helpers = require('./config/helpers'),
  webpack = require('webpack'),
  CleanWebpackPlugin = require('clean-webpack-plugin');



module.exports = {
  devtool: 'inline-source-map',

  resolve: {
    extensions: ['.ts', '.js']
  },

  entry: helpers.root('index.ts'),

  output: {
    path: helpers.root('dist/bundles'),
    publicPath: '/',
    filename: 'rest-cordova-advanced-http.umd.js',
    library: 'rest-cordova-advanced-http',
    libraryTarget: 'umd'
  },

  // require those dependencies but don't bundle them
  externals: [/^rest\-core/],

  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'awesome-typescript-loader',
      options: {
        declaration: false
      },
      exclude: [/\.spec\.ts$/]
    }]
  },

  plugins: [
    // fix the warning in ./~/@angular/core/src/linker/system_js_ng_module_factory_loader.js
    // new webpack.ContextReplacementPlugin(
    //     /angular(\\|\/)core(\\|\/)@angular/,
    //     helpers.root('./src')
    // ),

    // new webpack.LoaderOptionsPlugin({
    //     options: {
    //         tslintLoader: {
    //             emitErrors: false,
    //             failOnHint: false
    //         }
    //     }
    // }),

    // Reference: https://github.com/johnagan/clean-webpack-plugin
    // Removes the bundle folder before the build
    new CleanWebpackPlugin(['dist/bundles'], {
      root: helpers.root(),
      verbose: false,
      dry: false
    })
  ]
};
