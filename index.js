const { parallel } = require('fluture')

const information = require('./information')
const offers = require('./offers')

const product = asin =>
  parallel(1, [ getInformation(asin), getOffers(asin) ])
  .map(([ product, offers ]) => ({ ...product, offers }))

module.exports = { product, offers, information }
