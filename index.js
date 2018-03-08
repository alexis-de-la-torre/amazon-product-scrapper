const { encaseP } = require('fluture')
const { get } = require('axios')
const R = require('ramda')

const parsers = [
  // seller
  R.pipe(
    html => html.match(/<a id="bylineInfo" (.*?)>(.*?)<\/a>/gs),
    R.prop(0),
    R.replace(/<a id="bylineInfo" (.*?)>|<\/a>/g, ''),
  ),
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
    html => html.match(/<li>.*?<\/li>/gs),
    R.map(R.replace(/<li><span .*>|<\/span><\/li>/g, '')),
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
  R.pipe(
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
    R.dissoc('Customer Reviews'),
    R.dissoc('Best Sellers Rank'),
    R.evolve({ 'Shipping Weight': x => x.replace(/\(.*?\)/, '').trim() })
  ),
]

const keys = [ 'seller', 'title', 'price', 'characteristics', 'description', 'information' ]

const parseProduct = R.pipe(
  html => parsers.map(R.applyTo(html)),
  R.zipObj(keys),
  // R.prop('information')
)

const link = 'https://www.amazon.com/L-O-L-Surprise-551508-Pearl/dp/B078W1HYH8?pd_rd_wg=HwW6f&pd_rd_r=be31c96b-80de-429a-9ac4-ee1ebccc6017&pd_rd_w=oaws0&ref_=pd_gw_ri&pf_rd_r=7HT1WQB31M4EE1CHNJ75&pf_rd_p=c116cecb-5676-58e0-b306-0894a1d0149e'

encaseP(get, link)
  .map(R.prop('data'))
  .map(parseProduct)
  .fork(console.log, console.log)
