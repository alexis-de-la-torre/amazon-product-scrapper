const { encaseP2, parallel, Future } = require('fluture')
const { get } = require('axios')
const R = require('ramda')
const { fromString: htmlToText } = require('html-to-text')
const { parse: html } = require('fast-html-parser')

const host = 'https://www.amazon.com'

const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0'
}

const informationList = R.pipe(
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

const information = [
  R.pipe(
    html => html.match(/<div id="detail-bullets_feature_div">(.*?<\/div>){2}/gs),
    R.prop(0),
    html => html.match(/<div class="content">.*?<\/div>/gs),
    R.prop(0),
    informationList,
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
  // B00RBQ0G2I
  R.pipe(
    html => html.match(/<div id="detail-bullets">.*?<table .*?>.*?<\/table>/gs),
    R.prop(0),
    informationList,
    Future.of,
  )
]

const description = [
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
  // R.pipe(
  //   html,
  //   node => node.querySelector('#aplus3p_feature_div').text,
  //   R.replace(/\n{2,}/g, ''),
  //   Future.of,
  // )
]

const parsers = [
  // title
  R.pipe(
    html => html.match(/<span id="productTitle" (.*?)>(.*?)<\/span>/gs),
    R.prop(0),
    R.replace(/<span id="productTitle" (.*?)>|<\/span>/g, ''),
    R.trim,
    Future.of,
  ),
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
  html => {
    if (html.includes('id="productDescription"')) return description[0](html)
    else if (html.includes('class="feature"')) return Future.of('< feature >')
    else return Future.of('< not found >')
  },
  // information
  html => {
    if (html.includes('detail-bullets')) return information[2](html)
    else if (html.includes('detailBullets_sections1')) return information[1](html)
    else return information[0](html)
  },
]

const keys = [ 'title', 'characteristics', 'description', 'information' ]

const product = R.pipe(
  Future.of,
  R.map(asin => `https://www.amazon.com/dp/${asin}`),
  R.chain(link => encaseP2(get, link, { headers })),
  R.map(R.prop('data')),
  R.map(html => parsers.map(R.applyTo(html))),
  R.chain(parallel(6)),
  R.map(R.zipObj(keys)),
)

module.exports = product
