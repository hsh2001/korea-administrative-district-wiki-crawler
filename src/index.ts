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
 *
 * 서울특별시, 부산광역시
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

  return areaNames;
}

/**
 * 크롤링 유형 2
 *
 * 대구광역시
 */
async function getAreaNamesType2(cityName: string) {
  const $ = await loadCityWiki(cityName);
  const areaNames: string[] = [];
  const $table = $('table.wikitable').first();
  const titles = $table.find('td b a').toArray();

  for (const aTag of titles) {
    const $a = $(aTag);
    const regionName = $a.text().trim();
    const href = $a.prop('href');

    await axios.get(wikipediaRoot + href).then(({ data }) => {
      const $ = cheerio.load(data);

      const $table = $('#행정_구역')
        .parents('h2')
        .nextAll()
        .filter(function () {
          return this.tagName.toLowerCase() == 'table';
        })
        .first();

      const titles = $table.find('td b a').toArray();

      if (!titles.length) {
        console.warn(`no titles.length : ${regionName}`);
      }

      for (const aTag of titles) {
        const $a = $(aTag);
        const secondRegionName = $a.text().trim();

        if (secondRegionName == '행정동') {
          continue;
        }

        areaNames.push(
          `${cityName} ${regionName} ${secondRegionName}`
            .trim()
            .replace(/\s{2,}/g, ' ')
        );
      }
    });
  }

  return areaNames;
}

(async () => {
  const promises = [
    getAreaNamesType1('서울특별시'),
    getAreaNamesType1('부산광역시'),

    getAreaNamesType2('대구광역시'),
    getAreaNamesType2('인천광역시'),
  ];

  const areaNames = [...new Set(flat(await Promise.all(promises)))];

  console.log(areaNames.length, areaNames.slice(-10));
})();
