const { encaseP } = require('fluture')
const { get } = require('axios')
const R = require('ramda')
const $ = require('cheerio')
const { load: getDom } = require('cheerio')

const link = asin => `https://www.amazon.com/gp/offer-listing/${asin}`

const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0'
}

const getSeller = R.pipe(
  dom => dom('.olpSellerName').html(),
  html =>
  html.includes('<img alt="Amazon.com"')
  ? 'Amazon'
  : html.match(/<a .*?>.*?<\/a>/g)[0].replace(/<a .*?>|<\/a>/g, '').trim(),
)

const getPrice = dom =>
  parseFloat(dom('.olpOfferPrice').text().trim().replace('$', ''))

const getPrime = dom => dom.html().includes('Amazon Prime TM')

const getCondition = dom => dom('.olpCondition').text().trim()

const getOffers = asin =>
  encaseP2(get, link(asin), headers)
  .map(R.prop('data'))
  .map(getDom)
  .map(dom => dom('.olpOffer').toArray().map($).map(x => x.html()).map(getDom))
  .map(R.map(dom => ({
    seller: getSeller(dom),
    price: getPrice(dom),
    prime: getPrime(dom),
    condition: getCondition(dom),
  })))
  // .map(R.pluck('price'))

module.exports = getOffers
