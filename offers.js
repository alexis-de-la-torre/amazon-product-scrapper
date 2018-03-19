const { encaseP2 } = require('fluture')
const { get } = require('axios')
const R = require('ramda')
const $ = require('cheerio')
const { load: getDom } = require('cheerio')

const link = asin => `https://www.amazon.com/gp/offer-listing/${asin}`

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

const proxy = {
  host: '118.172.195.135',
  post: 8080,
}

const getSeller = R.pipe(
  dom => dom('.olpSellerName').html(),
  html =>
  html.includes('<img alt="Amazon.com"')
  ? 'Amazon'
  : html.match(/<a .*?>.*?<\/a>/g)[0].replace(/<a .*?>|<\/a>/g, '').trim(),
)

const getPrice = dom =>
  parseFloat(dom('.olpOfferPrice').text().trim().replace('$', ''))

const getPrime = dom => dom.html().includes('Amazon Prime TM')

const getCondition = dom => dom('.olpCondition').text().trim()

const getOffers = asin =>
  encaseP2(get, link(asin), { headers })
  .map(R.prop('data'))
  .map(getDom)
  .map(dom => dom('.olpOffer').toArray().map($).map(x => x.html()).map(getDom))
  .map(R.map(dom => ({
    seller: getSeller(dom),
    price: getPrice(dom),
    prime: getPrime(dom),
    condition: getCondition(dom),
  })))
  // .map(R.pluck('price'))

module.exports = getOffers
