import flat from 'array.prototype.flat';
import axios from 'axios';
import cheerio, { Cheerio, Element } from 'cheerio';

const wikipediaRoot = 'https://ko.wikipedia.org';

async function loadCityWiki(cityName: string) {
  const { data } = await axios.get(
    `${wikipediaRoot}/wiki/${encodeURI(`${cityName}의_행정_구역`)}`
  );

  return cheerio.load(data);
}

/**
 * 크롤링 유형 1
 */
async function getAreaNamesType1(cityName: string) {
  const $ = await loadCityWiki(cityName);
  const regionTitles = $('h3')
    .filter(function () {
      const headlineText = $(this).find('.mw-headline').text().trim();
      return !!headlineText && /[구군]$/.test(headlineText);
    })
    .toArray();

  const areaNames: string[] = [];

  for (const h3 of regionTitles) {
    const $h3 = $(h3);
    const $dl = $h3.next();

    const processDlTag = ($dl: Cheerio<Element>) => {
      if ($dl[0]?.tagName?.toLowerCase() != 'dl') {
        return;
      }

      const regionName = $h3.find('.mw-headline').text().trim();
      const dongList = $dl
        .find('dd')
        .text()
        .split('·')
        .map((s) => `${cityName} ${regionName} ${s.trim()}`);

      areaNames.push(...dongList);
      processDlTag($dl.next());
    };

    processDlTag($dl);
  }

  console.warn(`${cityName} has ${areaNames.length || 'no'} areaNames`);

  return areaNames;
}

/**
 * 크롤링 유형 2
 */
async function getAreaNamesType2(cityName: string) {
  const $ = await loadCityWiki(cityName);
  const areaNames: string[] = [];
  const $table = $('table.wikitable.sortable').first();
  const titles = $table.find('td b a').toArray();

  for (const aTag of titles) {
    const $a = $(aTag);
    const regionName = $a.text().trim();
    const href = $a.prop('href');

    await axios.get(wikipediaRoot + href).then(({ data }) => {
      const $ = cheerio.load(data);

      const $table = $(
        '#행정_구역, #행정구역, #행정_구역_및_인구, #행정_구역과_인구'
      )
        .parents('h2, h3')
        .first()
        .nextAll()
        .filter(function () {
          return this.tagName.toLowerCase() == 'table';
        })
        .first();

      const titles = $table.find('td a[title], th a[title]').toArray();

      if (!titles.length) {
        console.warn(`no titles.length : ${regionName}`);
      }

      for (const aTag of titles) {
        const $a = $(aTag);
        const secondRegionName = $a.text().trim();

        if (secondRegionName == '행정동') {
          continue;
        }

        areaNames.push(`${cityName} ${regionName} ${secondRegionName}`);
      }
    });
  }

  console.warn(`${cityName} has ${areaNames.length || 'no'} areaNames`);

  return areaNames;
}

/**
 * 크롤링 유형 제주
 */
async function getAreaNamesTypeJeju(cityName: '서귀포시' | '제주시') {
  const $ = await loadCityWiki(cityName);
  const areaNames = $('#행정_구역')
    .parents('h2')
    .nextAll()
    .filter(function () {
      return this.tagName.toLowerCase() == 'table';
    })
    .first()
    .find('tbody td b a')
    .toArray()
    .map((aTag) => {
      return `제주특별자치도 ${cityName} ${$(aTag).text().trim()}`;
    });

  console.warn(`${cityName} has ${areaNames.length || 'no'} areaNames`);

  return areaNames;
}

/**
 * 크롤링 유형 울산
 */
async function getAreaNameOnUlsan() {
  const $ = await loadCityWiki('울산광역시');

  return flat(
    $('table')
      .filter(function () {
        return $(this).find('img').length != 0;
      })
      .toArray()
      .map((table) => {
        const $table = $(table);
        const regionName = $table
          .find('tr:last-child b')
          .text()
          .trim()
          .replace('울산', '');

        if (!regionName) {
          return [];
        }

        return $table
          .find('td b a')
          .toArray()
          .map((aTag) => {
            return `울산광역시 ${regionName} ${$(aTag).text().trim()}`;
          });
      })
  );
}

/**
 * 크롤링 유형 세종
 */
async function getAreaNameOnSejong() {
  const $ = await loadCityWiki('세종특별자치시');
  return $('table.wikitable.sortable tbody')
    .first()
    .find('tr b a')
    .toArray()
    .map((aTag) => `세종특별자치시 ${$(aTag).text().trim()}`);
}

(async () => {
  const promises = [
    getAreaNamesType1('서울특별시'),
    getAreaNamesType1('부산광역시'),

    getAreaNamesType2('대구광역시'),
    getAreaNamesType2('인천광역시'),
    getAreaNamesType2('광주광역시'),
    getAreaNamesType2('대전광역시'),
    getAreaNamesType2('경기도'),
    getAreaNamesType2('강원도'),
    getAreaNamesType2('충청북도'),
    getAreaNamesType2('충청남도'),
    getAreaNamesType2('전라남도'),
    getAreaNamesType2('전라북도'),
    getAreaNamesType2('경상남도'),
    getAreaNamesType2('경상북도'),

    getAreaNamesTypeJeju('서귀포시'),
    getAreaNamesTypeJeju('제주시'),

    getAreaNameOnUlsan(),

    getAreaNameOnSejong(),
  ];

  const areaNames = [
    ...new Set(
      flat(await Promise.all(promises)).map((s) =>
        s.trim().replace(/\s{2,}/g, ' ')
      )
    ),
  ];

  console.log(areaNames.length, areaNames.slice(-10));
})();
