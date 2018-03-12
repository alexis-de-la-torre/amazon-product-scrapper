const R = require('ramda')
const { encaseP, parallel } = require('fluture')
const { get } = require('axios')

const parseCategory = R.pipe(
  html => html.match(/data-p13n-asin-metadata=".*?"/gs),
  R.map(R.replace(/data-p13n-asin-metadata="/g, '')),
  R.map(R.dropLast(1)),
  R.map(R.replace(/&quot;/g, '"')),
  R.map(JSON.parse),
  R.pluck('asin')
)

// String -> Array String
const pages = link =>
  encaseP(get, link)
  .map(R.prop('data'))
  .map(html => html.match(/id="zg_page.">/g))
  .map(R.length)
  .map(x => R.range(1, x + 1))
  .map(R.map(page => `${link}?pg=${page}`))

const category = link =>
  pages(link)
  .map(R.map(encaseP(get)))
  .chain(parallel(1))
  .map(R.map(R.prop('data')))
  .map(R.map(parseCategory))
  .map(R.flatten)

module.exports = category
