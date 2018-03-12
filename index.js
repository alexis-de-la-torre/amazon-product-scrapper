const { parallel, Future } = require('fluture')
const R = require('ramda')
const { render } = require('prettyjson')
const { encaseP } = require('fluture')
const { get } =  require('axios')
const sample = require('lodash.samplesize')

const product = require('./product')
const categories = require('./categories')
const category = require('./category')

const dev = process.env.NODE_ENV !== 'production'

const data =
  categories
  .map(x => dev ? sample(x) : x)
  .map(R.map(({ name, link }) => category(link).map(products => ({ name, products }))))
  .map(R.map(R.map(({ name, products }) => products.map(asin => ({ name, asin })))))
  .chain(parallel(1))
  .map(R.flatten)

const program = name => R.pipe(
  Future.of,
  R.map(R.tap(asin => console.log(`${name} :: ${asin}`))),
  R.chain(product),
)

// program('Home & Kitchen')('B014WOWNAY').fork(console.log, console.log)

const init = () =>
  data
  .map(x => dev ? sample(x, 2) : x)
  .map(R.map(({ name, asin }) => program(name)(asin)))
  .chain(parallel(1))
  .fork(console.log, console.log)

init()
