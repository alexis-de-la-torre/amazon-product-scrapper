const R = require('ramda')
const { encaseP } = require('fluture')
const { get } = require('axios')

const link = 'https://www.amazon.com/Best-Sellers/zgbs'

const parse = R.pipe(
  R.prop('data'),
  html => html.match(/<ul id="zg_browseRoot">.*?<\/ul>/gs),
  R.prop(0),
  html => html.match(/<li>.*?<\/li>/gs),
  R.map(R.replace(/<li><a href=\'|<\/a><\/li>/g, '')),
  R.map(html => html.match(/https:\/\/www\.amazon\.com\/.*?\/.*?\/.*?\/|(>.*)/g)),
  R.map(R.map(R.replace('>', ''))),
  R.drop(1),
  R.map(R.zipObj([ 'link', 'name' ])),
)

const categories =
  encaseP(get, link)
  .map(parse)

module.exports = categories
