process.env.BABEL_ENV = 'production'
process.env.NODE_ENV = 'production'

// :: we want to crash on unhandled promise rejections,
//    not just silently die
process.on('unhandledRejection', err => { throw err })

// :: ---

// :: ensure environment variables are parsed
require('../config/env')

const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const webpack = require('webpack')
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const printHostingInstructions = require('react-dev-utils/printHostingInstructions')
const FileSizeReporter = require('react-dev-utils/FileSizeReporter')
const printBuildError = require('react-dev-utils/printBuildError')

const config = require('../config/webpack.config.prod')
const paths = require('../config/paths')

const measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild
const printFilesSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild
const USE_YARN = fs.existsSync(paths.yarnLockFile)

// :: warn if files exceed these sizes
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024

// :: warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) process.exit(1)

// :: ---

function copyPublicFolder () {
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => file !== paths.appHtml
  })
}

function build (previousFileSizes) {
  console.log('Creating an optimized production build ...')

  const compiler = webpack(config)
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) return reject(err)
      // :: ---
      const messages = formatWebpackMessages(stats.toJson({}, true))
      if (messages.errors.length) {
        // :: only keep the first error
        if (messages.errors.length > 1) messages.errors.length = 1
        return reject(new Error(messages.errors.join('\n\n')))
      }
      // :: ---
      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' || process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            `
            \nTreating warnings as errors because process.env.CI = true.\n
            Most CI servers set it automatically.\n
            `
          )
        )
        return reject(new Error(messages.warnings.join('\n\n')))
      }
      // :: ---
      return resolve({
        stats,
        previousFileSizes,
        warnings: messages.warnings
      })
    })
  })
}

// :: ---

measureFileSizesBeforeBuild(paths.appBuild)
  .then(previousFileSizes => {
    fs.emptyDirSync(paths.appBuild)
    copyPublicFolder()

    // :: start the webpack build
    return build(previousFileSizes)
  })
  .then(
    ({ stats, previousFileSizes, warnings }) => {
      if (warnings.length) {
        console.log(chalk.yellow('Compiled with warnings.\n'))
        console.log(warnings.join('\n\n'))
        console.log(`\nSearch for the ${chalk.underline(chalk.yellow('keywords'))} to learn more about each warning.`)
        console.log(`To ignore, add ${chalk.cyan('// eslint-disable-next-line')} to the line before.\n`)
      } else {
        console.log(chalk.green('Compiled successfully.\n'))
      }

      console.log('File sizes after gzip:\n')
      printFilesSizesAfterBuild(
        stats,
        previousFileSizes,
        paths.appBuild,
        WARN_AFTER_BUNDLE_GZIP_SIZE,
        WARN_AFTER_CHUNK_GZIP_SIZE
      )
      console.log()

      const APP_PACKAGE = require(paths.appPackageJson)
      const PUBLIC_URL = paths.publicUrl
      const PUBLIC_PATH = config.output.publicPath
      const BUILD_FOLDER = path.relative(process.cwd(), paths.appBuild)

      printHostingInstructions(
        APP_PACKAGE,
        PUBLIC_URL,
        PUBLIC_PATH,
        BUILD_FOLDER,
        USE_YARN
      )
    },
    err => {
      console.log(chalk.red('Failed to compile.\n'))
      printBuildError(err)
      process.exit(1)
    }
  )
