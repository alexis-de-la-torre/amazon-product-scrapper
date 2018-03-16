// there are more pages for every product but the first 10 are enought for now

const R = require('ramda')
const { Future, encaseP2 } = require('fluture')
const { get } = require('axios')
const tag = require('closing-tag')
const sample = require('lodash.samplesize')
const { Nothing, Just } = require('crocks/Maybe')

const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0'
}

const host = 'https://www.amazon.com'

const link = asin => `${host}/gp/offer-listing/${asin}`

const seller = R.pipe(
  R.match(/<h3 class="a-spacing-none olpSellerName">.*?<\/span>/gs),
  R.prop(0),
  R.replace(/<h3 class="a-spacing-none olpSellerName">|<\/span>/, ''),
  R.trim,
  html =>
  html.includes('<img alt="Amazon.com"')
  ? 'Amazon'
  : html.match(/<a .*?>.*?<\/a>/g)[0].replace(/<a .*?>|<\/a>/g, '').trim(),
)

const price = R.pipe(
  R.match(/<span class="a-size-large a-color-price olpOfferPrice a-text-bold">.*?<\/span>/g),
  R.prop(0),
  R.replace(/<span class="a-size-large a-color-price olpOfferPrice a-text-bold">|<\/span>/g, ''),
  R.trim,
  R.drop(1),
  parseFloat,
)

const prime = html => html.includes('Amazon Prime TM')

const condition = R.pipe(
  R.match(/<span class="a-size-medium olpCondition a-text-bold">.*?<\/span>/gs),
  R.prop(0),
  R.replace(/<span class="a-size-medium olpCondition a-text-bold">|<\/span>/g, ''),
  R.trim,
)

const offers = R.pipe(
  asin => encaseP2(get, link(asin), { headers }),
  R.map(R.prop('data')),
  R.map(html => tag(/<div class="a-row a-spacing-mini olpOffer" .*?>/, 'div', html)),
  R.map(R.map(html => ({
    seller: seller(html),
    price: price(html),
    prime: prime(html),
    condition: condition(html),
  }))),
  // R.map(R.path([ 0, 'seller' ]))
)

module.exports = offers
