const { parallel } = require('fluture')

const information = require('./information')
const offers = require('./offers')

const product = asin =>
  parallel(1, [ information(asin), offers(asin) ])
  .map(([ product, offers ]) => ({ ...product, offers }))

module.exports = product
