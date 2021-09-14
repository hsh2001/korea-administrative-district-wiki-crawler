import axios from 'axios';
import cheerio from 'cheerio';

(async () => {
  const { data } = await axios.get(
    `https://ko.wikipedia.org/wiki/${encodeURI('서울특별시의_행정_구역')}`
  );

  const $ = cheerio.load(data);
  const regionTitles = $('h3')
    .filter(function () {
      const headlineText = $(this).find('.mw-headline').text().trim();
      return !!headlineText && /구$/.test(headlineText);
    })
    .toArray();

  for (const h3 of regionTitles) {
    const $h3 = $(h3);
    const $dl = $h3.next();

    if ($dl[0]?.tagName?.toLowerCase() != 'dl') {
      continue;
    }

    const regionName = $h3.find('.mw-headline').text().trim();
    const dongList = $dl
      .find('dd')
      .text()
      .split('·')
      .map((s) => `${regionName} ${s.trim()}`);

    console.log(dongList);
  }
})();
