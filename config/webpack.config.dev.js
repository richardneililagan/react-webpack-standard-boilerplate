const autoprefixer = require('autoprefixer')
const path = require('path')
const webpack = require('webpack')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')

const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const eslintFormatter = require('react-dev-utils/eslintFormatter')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')

const getClientEnvironment = require('./env')
const paths = require('./paths')

// :: ---

const PUBLIC_PATH = '/'
const PUBLIC_URL = ''
const ENV = getClientEnvironment(PUBLIC_URL)

// :: [Development Configuration] ---

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: [
    require.resolve('./polyfills'),
    require.resolve('react-dev-utils/webpackHotDevClient'),
    paths.appIndexJs
  ],

  output: {
    pathinfo: true,
    filename: 'static/js/bundle.js',
    chunkFilename: 'static/js/[name].chunk.js',
    publicPath: PUBLIC_PATH,
    devtoolModuleFilenameTemplate: info =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
  },

  resolve: {
    modules: ['node_modules', paths.appNodeModules].concat(
      process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
    ),
    extensions: ['.web.js', '.mjs', '.js', '.json', '.web.jsx', '.jsx'],
    alias: {
      'react-native': 'react-native-web'
    },
    plugins: [
      new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])
    ]
  },

  module: {
    strictExportPresence: true,
    rules: [
      // :: run lints
      {
        test: /\.(js|jsx|mjs)$/,
        enforce: 'pre',
        use: [
          {
            options: {
              formatter: eslintFormatter,
              eslintPath: require.resolve('eslint')
            },
            loader: require.resolve('eslint-loader')
          }
        ],
        include: paths.appSrc
      },

      {
        oneOf: [
          // :: url loader ---
          //    works just like a file loader, except it translates
          //    compatible files to a data URL if possible
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]'
            }
          },

          // :: postcss loader ---
          {
            test: /\.css$/,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: { importLoaders: 1 }
              },
              {
                loader: require.resolve('postcss-loader'),
                options: {
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    autoprefixer({
                      browsers: [
                        '>1%',
                        'last 4 versions',
                        'Firefox ESR',
                        'not ie < 9'
                      ],
                      flexbox: 'no-2009'
                    })
                  ]
                }
              }
            ]
          },

          // :: file loader ---
          {
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: require.resolve('file-loader'),
            options: {
              name: 'static/media/[name].[hash:8].[ext]'
            }
          }

          // :: NOTE
          //    If adding a new loader, make sure you add
          //    _before_ the file loader.
          // ------------------------------------------------------

        ]
      }
    ]
  },

  plugins: [
    // :: make env vars available in index.html
    new InterpolateHtmlPlugin(ENV.raw),
    // :: generate an index.html file with a <script> injected
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml
    }),
    // :: add module names to factory functions so they appear in browser profiler
    new webpack.NamedModulesPlugin(),
    // :: make parsed env vars available in the JS code
    new webpack.DefinePlugin(ENV.stringified),
    // :: enable hot modules
    new webpack.HotModuleReplacementPlugin(),
    // :: https://github.com/facebookincubator/create-react-app/issues/240
    new CaseSensitivePathsPlugin(),
    // :: https://github.com/facebookincubator/create-react-app/issues/186
    new WatchMissingNodeModulesPlugin(paths.appNodeModules),
    // :: https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ],

  // :: mock node modules that are superfluous in the browser
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },

  // :: turn off perf hints because we're not interested
  //    in perf so much in the development environments
  performance: {
    hints: false
  }
}
