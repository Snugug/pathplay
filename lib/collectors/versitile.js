import { parseFromSearch } from '../utils/puppeteer.js';
// import { manual } from './manual/ancestries.js';

await parseFromSearch(
  'https://2e.aonprd.com/Search.aspx?include-types=half-human%20heritage%3Bversatile%20heritage&display=full',
  // manual,
);
