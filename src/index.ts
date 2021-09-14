import flat from 'array.prototype.flat';
import axios from 'axios';
import cheerio, { Cheerio, Element } from 'cheerio';

/**
 * 유형 1
 *
 * 서울특별시, 부산광역시
 */
async function getAreaNamesType1(cityName: string) {
  const { data } = await axios.get(
    `https://ko.wikipedia.org/wiki/${encodeURI(`${cityName}의_행정_구역`)}`
  );

  const $ = cheerio.load(data);
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

(async () => {
  const areaNames = flat(
    await Promise.all([
      getAreaNamesType1('서울특별시'),
      getAreaNamesType1('부산광역시'),
    ])
  );

  console.log(areaNames);
})();
