const { parallel } = require('fluture')

const getInformation = require('./information')
// const offers = require('./offers')

const getProduct = asin =>
  getInformation(asin)
  // parallel(1, [ information(asin), offers(asin) ])
  // .map(([ product, offers ]) => ({ ...product, offers }))

module.exports = getProduct
