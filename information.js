const { Future, encaseP2 } = require('fluture')
const { get } = require('axios')
const $ = require('cheerio')
const { load: getDom } = require('cheerio')
const R = require('ramda')
const { fromString: getText } = require('html-to-text')

const link = asin => `https://www.amazon.com/dp/${asin}`

const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0',
  'Host': 'www.amazon.com',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cookie': `session-id-time=2082787201l; x-wl-uid=1ihD7YqUEoHDSyHU2EQvLlhd+zCRECKFWQJsXj8Z/2zNWKtTl3ZRzCH5oWsoj/ZSNsvlfStLXZrCTvs/THB8SMQ==; aws-target-static-id=1517078035118-523741; aws-target-visitor-id=1517078035120-991026; aws-target-data=%7B%22support%22%3A%221%22%7D; s_fid=31381AAF0011715D-1CFA6D055DE69F9C; s_dslv=1521151595681; s_vn=1548614035190%26vn%3D8; s_nr=1521151595681-Repeat; regStatus=pre-register; csm-hit=adb:adblk_yes&tb:s-4QP8BX79YVEACBKNAMEC|1521489581636; aws-ubid-main=288-6511838-8773351; sst-main=Sst1|PQHJ-K5KRlWgQ5-Uzy1noDnKCEFMejuT4BK3OgjbS-cQDWVy_BccORpJAoOIVVHZ3NR7Ps3b_Eb7UtXHzJjMN2vEzcM2oiItxIiey0sJ1ObIiphT36muWKixAQD3csLldhq-RzBKBNyugTAVJ1NG7CAp7Jdz9h8SxmHiwlmHT2y9yblpnaeR6EGMLfYL5ukbYF4OBfdMziUGMS91FcMBjWd2m2P8M_kYxvPOPkFIYfUg3CufoBWdxLQJ1HHcgQ19bVgZARqRmvbXkrj2chb06_W_Lg; s_pers=%20s_ev15%3D%255B%255B%2527www.google.com.mx%2527%252C%25271520528882567%2527%255D%252C%255B%2527www.google.com.mx%2527%252C%25271520528883318%2527%255D%252C%255B%2527www.google.com.mx%2527%252C%25271520528887244%2527%255D%252C%255B%2527www.google.com.mx%2527%252C%25271520528888862%2527%255D%252C%255B%2527www.google.com.mx%2527%252C%25271520528891713%2527%255D%255D%7C1678295291713%3B%20s_dl%3D1%7C1520542256054%3B%20gpv_page%3DUS%253ASC%253A%2520SellerCentralLogin%7C1520542256057%3B; s_vnum=1952536823121%26vn%3D3; at-main=Atza|IwEBIAhQaaHHEycEwI0MiO_Vb_UVUpyfwKoxCic4_KRQToq2YhzB61WiKCrVIgTDI2_aBmJ3ikyjLPLo9lWG5PuVXnsZV4rvwJsn_H5eLtpElGeqiS4GDBykAfuEOCFC0XgHPPDIOBKyZifM6bhWOTPCXShvcLFzd4lFc5R_Ll4VojdIfiLqjtmYBDB7dDJAjvpR-L67ojBD2qPTqdlQbmwznEggjBi4Dn1Uw_SYlTB6pTgQ1aKgSUw3aMK1pLTMzvBv-udUMafCPsU2mSfAZ0DNV2iV6CLpnSUT5kjI68o3xsDHto6GQbcZsp4SerxlPIQk3KK6xqByNP4pIxfZJnMFvVY4pFSkRnvq0YOGVmF8rj1mLVKUt7xt9mXP4b4qzBzLOQ4Vdp9pBz68PgNUo1NhNMjt; sess-at-main="f+j3qTq63/hPk17fZ9pUrG/ioxSpzCaJR6tkFbVSAdI="; session-id=144-7561262-0663550; ubid-main=131-0663094-6485243; x-main="33T7bsQO1wbkYOGB7ApGpXM?@sC6nP1EOB8LZte@7rA5NaEwkeI@ADSYBWsSQUpX"; session-token="tLRN5Wp2wYzifFURMDJAn8LivAPSWVLEaY+yKwmJyoAuGNrc9exuus//FbWbquuBQr0hi+YD6zZWu9c6D+lDQfvyzOMrIqnjLIi8x0YQhaOn8A3SXOjHiYNIHnNfC2DST0xNblBzJp1Qq+jP1oEj5IxU4fTmB4GX0PhAHdv8JXso4Y0jqIS4c0KjY3ZgGB64IxBu+3dsfNAZZAYNEVOxSp9FTpA5sxGV9eBWjzVbvZR92KAMBiNqoEHmYVw2kQtP/wzO0TVw76Y="; spblockdate=1521158001955`,
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': 1,
}

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
  ),
  // B0042SR4IW
  R.pipe(
    dom => dom('#bissProductSpecification_feature_div tr').toArray(),
    R.map($),
    R.map(dom => dom.html()),
    // this could be a "fromTable" function
    R.map(R.trim),
    R.map(R.replace(/<th .*?>|<td.*?>|<\/td>/g, '')),
    R.map(R.split('</th>')),
    R.map(R.map(R.trim)),
    R.fromPairs,
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
    html => getText(html, { wordwrap: null, ignoreImage: true }),
    R.trim,
  ),
  // B06ZYWGCZG
  R.pipe(
    dom => dom('#aplus p').toArray().map($),
    R.map(dom => dom.html()),
    R.join('\n\n'),
    html => getText(html, { wordwrap: null, ignoreImage: true }),
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
  R.dissoc('Shipping Advisory'),
  R.dissoc('Shipping Information'),
  R.dissoc('Amazon Best Sellers Rank'),
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
    // this could be a "fromTable" function
    R.map(R.replace(/<td .*?>|<\/td>$/g, '')),
    R.map(R.split('</td>')),
    R.map(R.map(R.trim)),
    R.fromPairs,
    //
    cleanInformation,
  ),
  // B0042SR4IW
  R.pipe(
    dom => dom('#detail-bullets .content > ul > li').toArray().map($),
    R.map(dom => dom.html()),
    R.map(R.replace('<b>', '')),
    R.map(R.split('</b>')),
    R.map(R.map(R.trim)),
    R.map(R.map(R.replace(':', ''))),
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
      : html.includes('id="bissProductSpecification_feature_div"')
      ? features[1](dom)
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
      : html.includes('id="detail-bullets"')
      ? information[2](dom)
      : '<!not found>',
    image:
      html.includes()
      ? image[0](dom)
      : '<!not found>'
  })
}

const getProduct = asin =>
  encaseP2(get, link(asin), { headers })
  .map(R.prop('data'))
  .map(router)
  .map(R.assoc('link', link(asin)))

module.exports = getProduct
