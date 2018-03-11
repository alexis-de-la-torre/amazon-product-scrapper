const { encaseP, parallel, Future } = require('fluture')
const { get } = require('axios')
const R = require('ramda')
const { render } = require('prettyjson')
const { fromString: htmlToText } = require('html-to-text')

const host = 'https://www.amazon.com'

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
    encaseP(get),
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
  html => parsers.map(R.applyTo(html)),
  parallel(6),
  R.map(R.zipObj(keys)),
)

const links = [
  'https://www.amazon.com/L-O-L-Surprise-551508-Pearl/dp/B078W1HYH8/ref=zg_bs_toys-and-games_14?_encoding=UTF8&psc=1&refRID=DK20YSPG5DK7MW297480',
  'https://www.amazon.com/Optimum-Nutrition-Standard-Protein-Chocolate/dp/B000QSNYGI/ref=sr_1_3_a_it?ie=UTF8&qid=1520549221&sr=8-3&keywords=protein%2Bpowder&th=1',
  'https://www.amazon.com/Bluetooth-Cayuo-Wireless-Headphones-Earpieces/dp/B079K48DNT/ref=zg_bs_musical-instruments_4?_encoding=UTF8&psc=1&refRID=A0RNVS0B0MRKQ9Q0Q405',
  'https://www.amazon.com/Polaroid-Premium-Photo-QUINTUPLE-Sheets/dp/B008GVVUFE/ref=zg_bs_photo_6?_encoding=UTF8&psc=1&refRID=AVEPRT4RN1YK84RSQDBG',
]

parallel(2, links.map(encaseP(get)))
  .map(R.map(R.prop('data')))
  .map(R.map(parseProduct))
  .chain(parallel(1))
  // .map(R.path([ 0, 'information' ]))
  // .map(R.pluck('description'))
  .map(render)
  .fork(console.log, console.log)
