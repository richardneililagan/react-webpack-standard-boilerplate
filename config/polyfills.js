if (typeof Promise === 'undefined') {
  require('promise/lib/rejection-tracking').enable()
  window.Promise = require('promise/lib/es6-extensions.js')
}

require('whatwg-fetch')

Object.assign = require('object-assign')

// :: polyfill `requestAnimationFrame` only in test
if (process.env.NODE_ENV === 'test') require('raf').polyfill(global)
