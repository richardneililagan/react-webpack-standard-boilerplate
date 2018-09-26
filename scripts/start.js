process.env.BABEL_ENV = 'development'
process.env.NODE_ENV = 'development'

process.on('unhandledRejection', err => { throw err })

// :: ---

// :: ensure env vars are parsed
require('../config/env')

const fs = require('fs')
const chalk = require('chalk')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const clearConsole = require('react-dev-utils/clearConsole')
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles')
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls
} = require('react-dev-utils/WebpackDevServerUtils')
const openBrowser = require('react-dev-utils/openBrowser')

const paths = require('../config/paths')
const config = require('../config/webpack.config.dev')
const createDevServerConfig = require('../config/webpackDevServer.config')

const USE_YARN = fs.existsSync(paths.yarnLockFile)
const IS_INTERACTIVE = process.stdout.isTTY

// :: warn and crash if mandatory files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) process.exit(1)

// // :: tools like Cloud9 rely on this
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000
const HOST = process.env.HOST || '0.0.0.0'

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )} ...`
    )
  )

  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  )

  console.log(`Learn more here: ${chalk.yellow('http://bit.ly/2mwWSwH')}`)
  console.log()
}

// // :: ---

choosePort(HOST, DEFAULT_PORT)
  .then(port => {
    // :: check for a port
    if (port == null) return
    // :: ---
    const PROTOCOL = process.env.HTTPS === 'true' ? 'https' : 'http'
    const APP_NAME = require(paths.appPackageJson).name
    const URLS = prepareUrls(PROTOCOL, HOST, port)

    // // :: create a webpack compiler configured with custom messages
    const compiler = createCompiler(webpack, config, APP_NAME, URLS, USE_YARN)
    const proxySetting = require(paths.appPackageJson).proxy
    const proxyConfig = prepareProxy(proxySetting, paths.appPublic)
    const serverConfig = createDevServerConfig(
      proxyConfig,
      URLS.lanUrlForConfig
    )
    const devServer = new WebpackDevServer(compiler, serverConfig)

    // :: launch webpack dev server
    devServer.listen(port, HOST, err => {
      if (err) return console.log(err)
      // :: ---
      if (IS_INTERACTIVE) clearConsole()
      // :: ---
      console.log(chalk.cyan('Starting the development server ... \n'))
      openBrowser(URLS.localUrlForBrowser)
    })

    process.on('SIGINT', () => {
      devServer.close()
      process.exit()
    })

    process.on('SIGTERM', () => {
      devServer.close()
      process.exit()
    })
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message)
    }

    process.exit(1)
  })
