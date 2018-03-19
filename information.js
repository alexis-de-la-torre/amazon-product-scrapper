const { Future, encaseP } = require('fluture')
const { get } = require('axios')
const $ = require('cheerio')
const { load: getDom } = require('cheerio')
const R = require('ramda')
const { fromString: getText } = require('html-to-text')

const link = asin => `https://www.amazon.com/dp/${asin}`

const title = [
  // B06XG7S83W
  dom => dom('#productTitle').text().trim()
]

const features = [
  // B06XG7S83W
  R.pipe(
    dom => dom('#feature-bullets span.a-list-item').toArray().map($),
    R.map(dom => dom.text()),
    R.map(R.trim),
    R.reject(x => x.includes('Enter your model number'))
  )
]

const description = [
  // B06XG7S83W
  R.pipe(
    dom => dom('#productDescription').html(),
    R.replace(/<div class="disclaim">.*?<\/div>/gs, ''),
    R.replace(/<!-- .*? -->/gs, ''),
    R.replace(/<style type="text\/css">.*?<\/style>/gs, ''),
    R.replace(/<script type="text\/javascript">.*?<\/script>/gs, ''),
    R.replace(/<\/div>/g, ''),
    getText,
    R.trim,
  ),
  // B06ZYWGCZG
  R.pipe(
    dom => dom('#aplus p').toArray().map($),
    R.map(dom => dom.html()),
    R.join('\n\n'),
    getText,
  )
]

const cleanInformation = R.pipe(
  R.dissoc('Average Customer Review'),
  R.dissoc('Best Sellers Rank'),
  R.dissoc('Customer Reviews'),
  R.dissoc('International Shipping'),
  R.dissoc('Domestic Shipping'),
  R.dissoc('Date first available at Amazon.com'),
  R.dissoc('&#xA0;'),
  R.evolve({ 'Shipping Weight': x => x.replace(/\(.*?\)/, '').trim() }),
)

const information = [
  // B06XG7S83W
  R.pipe(
    dom => dom('#productDetails_detailBullets_sections1 tr').toArray(),
    R.map($),
    R.map(x => x.html()),
    R.map(R.replace(/<th .*?>|<td .*?>|<\/td>/g, '')),
    R.map(R.split('</th>')),
    R.map(R.map(R.trim)),
    R.fromPairs,
    cleanInformation,
  ),
  // B01COH2R98
  R.pipe(
    dom => dom('#prodDetails table > tbody > tr').toArray().map($),
    R.map(dom => dom.html()),
    R.map(R.replace(/<td .*?>|<\/td>$/g, '')),
    R.map(R.split('</td>')),
    R.map(R.map(R.trim)),
    R.fromPairs,
    cleanInformation,
  )
]

// data-a-dynamic-image='{"https://images-na.ssl-images-amazon.com/images/I/61eadgHe5YL._SY450_.jpg":[450,369],"https://images-na.ssl-images-amazon.com/images/I/61eadgHe5YL._SY355_.jpg":[355,291],"https://images-na.ssl-images-amazon.com/images/I/61eadgHe5YL.jpg":[500,410]}'

const image = [
  // B06XG7S83W
  R.pipe(
    dom => dom('#landingImage').data('a-dynamic-image'),
    R.keys,
    R.last,
  )
]

const router = html => {
  const dom = getDom(html)

  return ({
    title:
      html.includes('id="productTitle"')
      ? title[0](dom)
      : '<!not found>',
    features:
      html.includes('id="feature-bullets"')
      ? features[0](dom)
      :'<!not found>',
    description:
      html.includes('id="productDescription"')
      ? description[0](dom)
      : html.includes('class="feature"')
      ? description[1](dom)
      : '<!not found>',
    information:
      html.includes('id="productDetails_detailBullets_sections1"')
      ? information[0](dom)
      : html.includes('id="prodDetails"')
      ? information[1](dom)
      : '<!not found>',
    image:
      html.includes()
      ? image[0](dom)
      : '<!not found>'
  })
}

const getProduct = asin =>
  encaseP(get, link(asin))
  .map(R.prop('data'))
  .map(router)
  .map(R.assoc('link', link(asin)))
  // .map(R.prop('information'))

module.exports = getProduct
