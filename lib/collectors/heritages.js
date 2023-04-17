import { parseFromSearch } from '../utils/puppeteer.js';
// import { manual } from './manual/ancestries.js';

await parseFromSearch(
  'https://2e.aonprd.com/Search.aspx?include-types=heritage&display=full',
  // manual,
);
