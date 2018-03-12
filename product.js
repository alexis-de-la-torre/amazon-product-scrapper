const { encaseP2, parallel, Future } = require('fluture')
const { get } = require('axios')
const R = require('ramda')
const { fromString: htmlToText } = require('html-to-text')

const host = 'https://www.amazon.com'

const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0'
}

const information = [
  R.pipe(
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
    Future.of,
  ),
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
    R.evolve({ 'Shipping Weight': x => x.replace(/\(.*?\)/, '').trim() }),
    R.dissoc('Customer Reviews'),
    R.dissoc('Best Sellers Rank'),
    Future.of,
  ),
]

const price = [
  R.pipe(
    html => html.match(/<span id="priceblock_ourprice" (.*?)>(.*?)<\/span>/gs),
    R.prop(0),
    R.replace(/<span id="priceblock_ourprice" (.*?)>|<\/span>/g, ''),
    R.drop(1),
    parseFloat,
    Future.of,
  ),
  R.pipe(
    html => html.match(/Available from <a href='.*?'>/gs),
    R.prop(0),
    R.replace(/Available from <a href='|'>/g, ''),
    R.concat('https://www.amazon.com'),
    link => encaseP2(get, link, { headers }),
    R.map(R.prop('data')),
    R.map(html => html.match(/<span class="a-size-large a-color-price olpOfferPrice a-text-bold">.*?<\/span>/gs)),
    // Here i could get more info on the price (seller, shipping, etc)
    R.map(R.prop(0)),
    R.map(R.replace(/<span class="a-size-large a-color-price olpOfferPrice a-text-bold">|<\/span>/g, '')),
    R.map(R.trim),
  )
]

const parsers = [
  // seller
  html =>
  Future.of(
    html.match(/<a id=("bylineInfo"|"brand") .*?>.*?<\/a>/gs)[0]
    .replace(/<a .*?>|<\/a>/g, '')
    .trim()
  ),
  // title
  R.pipe(
    html => html.match(/<span id="productTitle" (.*?)>(.*?)<\/span>/gs),
    R.prop(0),
    R.replace(/<span id="productTitle" (.*?)>|<\/span>/g, ''),
    R.trim,
    Future.of,
  ),
  // price
  html => {
    if (html.includes('Available from')) return price[1](html)
    else return price[0](html)
  },
  // characteristics
  R.pipe(
    html => html.match(/<div id="feature-bullets" .*?>(.*?<\/div>){5}/gs),
    R.prop(0),
    html => html.match(/<li.*?>.*?<\/li>/gs),
    R.map(R.replace(/<li.*?><span .*>|<\/span><\/li>/g, '')),
    R.map(R.trim),
    R.reject(x => x.includes('replacementPartsFitmentBulletInner')),
    Future.of,
  ),
  // description
  R.pipe(
    html => html.match(/<div id="productDescription" .*?>(.*?<\/div>){2}/gs),
    R.prop(0),
    R.replace(/<div id="productDescription" .*?>|(<\/div>)+$/g, ''),
    R.replace(/<div class="disclaim">.*?<\/div>/gs, ''),
    R.replace(/<!-- .*? -->/gs, ''),
    R.replace(/<style type="text\/css">.*?<\/style>/gs, ''),
    R.replace(/<script type="text\/javascript">.*?<\/script>/gs, ''),
    R.replace(/<\/div>/g, ''),
    htmlToText,
    R.trim,
    Future.of,
  ),
  // information
  html => {
    if (html.includes('productDetails_detailBullets_sections1')) return information[1](html)
    else return information[0](html)
  },
]

const keys = [ 'seller', 'title', 'price', 'characteristics', 'description', 'information' ]

const parseProduct = R.pipe(
  Future.of,
  R.map(asin => `https://www.amazon.com/dp/${asin}`),
  R.chain(link => encaseP2(get, link, { headers })),
  R.map(R.prop('data')),
  R.map(html => parsers.map(R.applyTo(html))),
  R.chain(parallel(6)),
  R.map(R.zipObj(keys)),
)

module.exports = parseProduct