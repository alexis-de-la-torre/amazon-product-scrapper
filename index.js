const { parallel, Future } = require('fluture')
const R = require('ramda')
const { render } = require('prettyjson')
const { encaseP } = require('fluture')
const { get } =  require('axios')

const categories = require('./categories')
const product = require('./product')

categories
.fork(console.log, console.log)

// const ids = [
//    'B078W1HYH8',
//    'B000QSNYGI',
//    'B079K48DNT',
//    'B008GVVUFE',
// ]
//
// const init = () =>
//   Future.of(ids)
//   .map(R.map(product))
//   .chain(parallel(1))
//   .map(render)
//   .fork(console.log, console.log)
//
// init()
