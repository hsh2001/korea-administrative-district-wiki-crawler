import axios from 'axios';
import cheerio from 'cheerio';

import { wikipediaRoot } from './crawler';

export async function loadCityWiki(cityName: string) {
  const { data } = await axios.get(
    `${wikipediaRoot}/wiki/${encodeURI(`${cityName}의_행정_구역`)}`
  );

  return cheerio.load(data);
}
