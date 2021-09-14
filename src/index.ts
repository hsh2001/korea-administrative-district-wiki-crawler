import {
  getAreaNameOnSejong,
  getAreaNameOnUlsan,
  getAreaNamesType1,
  getAreaNamesType2,
  getAreaNamesTypeJeju,
} from './crawler';

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
      (await Promise.all(promises))
        .flat()
        .map((s) => s.trim().replace(/\s{2,}/g, ' '))
    ),
  ];

  console.log(areaNames.length, areaNames.slice(-10));
})();
