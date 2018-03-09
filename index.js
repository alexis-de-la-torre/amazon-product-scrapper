const { encaseP, parallel } = require('fluture')
const { get } = require('axios')
const R = require('ramda')
const { render } = require('prettyjson')

const host = 'https://www.amazon.com'

const infoTable = R.pipe(
  html => html.match(/<table id="productDetails_detailBullets_sections1" .*?>.*?<\/table>/gs),
  R.prop(0),
  R.replace(/<table id="productDetails_detailBullets_sections1" .*?>|(<\/table>)+$/g, ''),
  R.trim,
  html => html.match(/<tr>.*?<\/tr>/gs),
  R.map(R.replace(/<tr>|<\/tr>/g, '')),
  R.map(R.trim),
  R.map(R.replace(/<th.*?>|<td.*?>|<\/td>/g, '')),
  R.map(R.split('</th>')),
  R.map(R.map(R.trim)),
  R.fromPairs,
  R.evolve({ 'Shipping Weight': x => x.replace(/\(.*?\)/, '').trim() }),
  R.dissoc('Customer Reviews'),
  R.dissoc('Best Sellers Rank'),
)

const infoStandard = R.pipe(
  html => html.match(/<div id="detail-bullets_feature_div">(.*?<\/div>){2}/gs),
  R.prop(0),
  html => html.match(/<div class="content">.*?<\/div>/gs),
  R.prop(0),
  html => html.match(/<li>.*?<\/li>/gs),
  R.map(R.replace(/<li>|<\/li>|<b>/g, '')),
  R.map(R.trim),
  R.map(R.split('</b>')),
  R.map(R.map(R.trim)),
  R.map(R.map(R.replace(':', ''))),
  R.fromPairs,
  R.evolve({ 'Shipping Weight': x => x.replace(/\(.*?\)/, '').trim() }),
  R.dissoc('Average Customer Review'),
)

const parsers = [
  // seller
  html =>
  html.match(/<a id=("bylineInfo"|"brand") .*?>.*?<\/a>/gs)[0]
  .replace(/<a .*?>|<\/a>/g, '')
  .trim(),
  // title
  R.pipe(
    html => html.match(/<span id="productTitle" (.*?)>(.*?)<\/span>/gs),
    R.prop(0),
    R.replace(/<span id="productTitle" (.*?)>|<\/span>/g, ''),
    R.trim
  ),
  // price
  R.pipe(
    html => html.match(/<span id="priceblock_ourprice" (.*?)>(.*?)<\/span>/gs),
    R.prop(0),
    R.replace(/<span id="priceblock_ourprice" (.*?)>|<\/span>/g, ''),
    R.drop(1),
    parseFloat
  ),
  // characteristics
  R.pipe(
    html => html.match(/<div id="feature-bullets" .*?>(.*?<\/div>){5}/gs),
    R.prop(0),
    html => html.match(/<li.*?>.*?<\/li>/gs),
    R.map(R.replace(/<li.*?><span .*>|<\/span><\/li>/g, '')),
    R.map(R.trim)
  ),
  // description
  R.pipe(
    html => html.match(/<div id="productDescription" .*?>(.*?<\/div>){2}/gs),
    R.prop(0),
    R.replace(/<div id="productDescription" .*?>|(<\/div>)+$/g, ''),
    R.trim
  ),
  // information
  html => {
    if (html.includes('<div class="content">')) return infoStandard(html)
    else return infoTable(html)
  },
]

const keys = [ 'seller', 'title', 'price', 'characteristics', 'description', 'information' ]

const parseProduct = R.pipe(
  html => parsers.map(R.applyTo(html)),
  R.zipObj(keys),
  R.dissoc('description')
)

const links = [
  'https://www.amazon.com/Optimum-Nutrition-Standard-Protein-Chocolate/dp/B000QSNYGI/ref=sr_1_3_a_it?ie=UTF8&qid=1520549221&sr=8-3&keywords=protein%2Bpowder&th=1',
  'https://www.amazon.com/Bluetooth-Cayuo-Wireless-Headphones-Earpieces/dp/B079K48DNT/ref=zg_bs_musical-instruments_4?_encoding=UTF8&psc=1&refRID=A0RNVS0B0MRKQ9Q0Q405'
]

parallel(2, links.map(encaseP(get)))
  .map(R.map(R.prop('data')))
  .map(R.map(parseProduct))
  // .map(R.path([ 0, 'information' ]))
  .map(render)
  .fork(console.log, console.log)

// const link = 'https://www.amazon.com/gp/rss/bestsellers/movies-tv/ref=zg_bs_movies-tv_rsslink'
//
// encaseP(get, link)
//   .map(R.prop('data'))
//   .chain(encaseP(rss))
//   .fork(console.log, console.log)
