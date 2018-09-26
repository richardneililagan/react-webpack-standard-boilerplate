process.env.BABEL_ENV = 'test'
process.env.NODE_ENV = 'test'
process.env.PUBLIC_URL = ''

process.on('unhandleRejection', err => { throw err })

// :: ---

// :: ensure env vars are parsed
require('../config/env')

const jest = require('jest')
const argv = process.argv.slice(2)

// :: watch unless in CI or coverage
if (!process.env.CI && argv.indexOf('--coverage') < 0) argv.push('--watch')

jest.run(argv)
