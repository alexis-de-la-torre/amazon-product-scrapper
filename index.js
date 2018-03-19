const { parallel } = require('fluture')

const getInformation = require('./information')
const getOffers = require('./offers')

const getProduct = asin =>
  getInformation(asin)
  // parallel(1, [ getInformation(asin), getOffers(asin) ])
  // .map(([ product, offers ]) => ({ ...product, offers }))

module.exports = getProduct
