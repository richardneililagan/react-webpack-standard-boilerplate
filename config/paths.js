const path = require('path')
const fs = require('fs')
const url = require('url')

// :: ---

const APP_DIR = fs.realpathSync(process.cwd())
const ENV_PUBLIC_URL = process.env.PUBLIC_URL

const resolveApp = relativePath => path.resolve(APP_DIR, relativePath)
const getPublicUrl = packagejson => ENV_PUBLIC_URL || require(packagejson).homepage

// :: ---

function ensureSlash (path, needsSlash) {
  const hasSlash = path.endsWith('/')
  if (hasSlash && !needsSlash) {
    return path.substr(path, path.length - 1)
  } else if (!hasSlash && needsSlash) {
    return `${path}/`
  } else {
    return path
  }
}

function getServedPath (packagejson) {
  const publicUrl = getPublicUrl(packagejson)
  const servedUrl = ENV_PUBLIC_URL || (publicUrl ? url.parse(publicUrl).pathname : '/')

  return ensureSlash(servedUrl, true)
}

// :: ---

module.exports = {
  dotenv: resolveApp('.env'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveApp('src/index.js'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  testsSetup: resolveApp('src/setupTests.js'),
  appNodeModules: resolveApp('node_modules'),
  yarnLockFile: resolveApp('yarn.lock'),

  publicUrl: getPublicUrl(resolveApp('package.json')),
  servedPath: getServedPath(resolveApp('package.json'))
}
