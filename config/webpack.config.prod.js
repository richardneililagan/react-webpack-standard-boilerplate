//
// :: This is the PRODUCTION configuration for Webpack.
//
const autoprefixer = require('autoprefixer')
const path = require('path')
const webpack = require('webpack')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')

const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')
const eslintFormatter = require('react-dev-utils/eslintFormatter')

const paths = require('./paths')
const getClientEnvironment = require('./env')

// :: ---

const PUBLIC_PATH = paths.servedPath
const PUBLIC_URL = PUBLIC_PATH.slice(0, -1)
const ENV = getClientEnvironment(PUBLIC_URL)

const CSS_FILENAME = 'static/css/[name].[contenthash:8].css'
const OUTPUT_FILENAME = 'static/js/[name].[chunkhash:8].js'
const CHUNK_FILENAME = 'static/js/[name].[chunkhash:8].chunk.js'

// :: assert this to be safe
if (ENV.stringified['process.env'].NODE_ENV !== '"production"') {
  throw new Error('Production builds must have NODE_ENV=production.')
}

// :: [Toggles] ---

const SHOULD_USE_RELATIVE_ASSET_PATHS = PUBLIC_PATH === './'
const SHOULD_GENERATE_SOURCEMAP = process.env.GENERATE_SOURCEMAP !== 'false'

// :: [Production Configuration] ---

const EXTRACTTEXT_PLUGIN_OPTIONS = SHOULD_USE_RELATIVE_ASSET_PATHS
  ? { publicPath: Array(CSS_FILENAME.split('/').length).join('../') }
  : {}

// :: production configuration compiles slowly,
//    but focuses on producing a fast and minimal bundle.
module.exports = {
  bail: true,
  devtool: SHOULD_GENERATE_SOURCEMAP ? 'source-map' : false,

  entry: [require.resolve('./polyfills'), paths.appIndexJs],

  output: {
    path: paths.appBuild,
    filename: OUTPUT_FILENAME,
    chunkFilename: CHUNK_FILENAME,
    publicPath: PUBLIC_PATH,
    devtoolModuleFilenameTemplate: (info) =>
      path
        .relative(paths.appSrc, info.absoluteResourcePath)
        .replace(/\\/g, '/')
  },

  resolve: {
    modules: ['node_modules', paths.appNodeModules].concat(
      process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
    ),
    extensions: ['web.js', '.mjs', '.js', '.json', '.web.jsx', '.jsx'],
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
          // :: prefer url loader over file loader, because it transforms
          //    eligible files into data URLs
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]'
            }
          },

          // :: perform Babel processing
          {
            test: /\.(js|jsx|mjs)$/,
            include: paths.appSrc,
            loader: require.resolve('babel-loader'),
            options: { compact: true }
          },

          // :: perform PostCSS processing
          {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract(
              Object.assign(
                {
                  fallback: {
                    loader: require.resolve('style-loader'),
                    options: { hmr: false }
                  },
                  use: [
                    {
                      loader: require.resolve('css-loader'),
                      options: {
                        importLoaders: 1,
                        minimize: true,
                        sourceMap: SHOULD_GENERATE_SOURCEMAP
                      }
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
                EXTRACTTEXT_PLUGIN_OPTIONS
              )
            )
          },

          // :: transfer flat files to the build folder
          {
            loader: require.resolve('file-loader'),
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            options: { name: 'static/media/[name].[hash:8].[ext]' }
          }

          // :: NOTE
          //    If adding a new loader, add it _before_ the file loader.
        ]
      }
    ]
  },

  plugins: [
    new InterpolateHtmlPlugin(ENV.raw),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    new webpack.DefinePlugin(ENV.stringified),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        comparisons: false
      },
      mangle: { safari10: true },
      output: {
        comments: false,
        ascii_only: true
      },
      sourceMap: SHOULD_GENERATE_SOURCEMAP
    }),
    new ExtractTextPlugin({
      filename: CSS_FILENAME
    }),
    new ManifestPlugin({
      fileName: 'asset-manifest.json'
    }),
    new SWPrecacheWebpackPlugin({
      dontCacheBustUrlsMatching: /\/\w{8}\./,
      filename: 'service-worker.js',
      minify: true,
      navigateFallback: PUBLIC_URL + '/index.html',
      navigateFallbackWhitelist: [/^(?!\/__).*/],
      staticFileGlobsIgnorePatterns: [/\.map$/, /asset-manifest\.json$/],

      logger (message) {
        // :: some messages we'd like to skip
        if (message.indexOf('Total precache size is') === 0) return
        if (message.indexOf('Skipping static resource') === 0) return

        console.log(message)
      }
    }),

    // :: just in case you're using Moment.js
    //    https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ],

  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  }
}
