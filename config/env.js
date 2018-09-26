const fs = require('fs')
const path = require('path')
const paths = require('./paths')

// :: ---

// :: make sure that including [paths.js] after [env.js]
//    will read .env variables
delete require.cache[require.resolve('./paths')]

// :: ensure NODE_ENV is specified
const NODE_ENV = process.env.NODE_ENV
if (!NODE_ENV) throw new Error('The NODE_ENV env var is required, but was not specified.')

// :: ---

const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  // :: only include local base during tests
  //    to ensure consistency between environments
  NODE_ENV !== 'test' && `${paths.dotenv}.local`,
  paths.dotenv
].filter(Boolean)

dotenvFiles.forEach(file => {
  if (!fs.existsSync(file)) return

  require('dotenv-expand')(
    require('dotenv').config({
      path: file
    })
  )
})

// :: ---

const APP_DIR = fs.realpathSync(process.cwd())
process.env.NODE_PATH = (process.env.NODE_PATH || '')
  .split(path.delimiter)
  .filter(folder => folder && !path.isAbsolute(folder))
  .map(folder => path.resolve(APP_DIR, folder))
  .join(path.delimiter)

const REACT_APP = /^REACT_APP_/i

// :: ---

module.exports = (publicUrl) => {
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce((env, key) => {
      env[key] = process.env[key]
      return env
    }, {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PUBLIC_URL: publicUrl
    })

  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key])
      return env
    }, {})
  }

  return { raw, stringified }
}
