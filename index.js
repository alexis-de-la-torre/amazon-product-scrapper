const { parallel, Future } = require('fluture')
const R = require('ramda')
const { render } = require('prettyjson')
const { encaseP, encaseN2 } = require('fluture')
const { get } =  require('axios')
const sample = require('lodash.samplesize')
const { readFile } = require('fs')

const product = require('./product')
const category = require('./category')

const dev = process.env.NODE_ENV !== 'production'

const data =
  encaseN2(readFile, 'tops.txt', 'utf-8')
  .map(R.split('\n\n'))
  .map(R.map(R.split('\n')))
  .map(R.map(R.zipObj([ 'name', 'link' ])))
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

// program('')('B0037STB02').fork(console.log, console.log)

const init = () =>
  data
  .map(x => dev ? sample(x) : x)
  .map(R.map(({ name, asin }) => program(name)(asin)))
  .chain(parallel(1))
  .map(render)
  .fork(console.log, console.log)

init()
