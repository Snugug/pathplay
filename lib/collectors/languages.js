import { parseFromSearch } from '../utils/puppeteer.js';

await parseFromSearch(
  'https://2e.aonprd.com/Search.aspx?include-types=language&display=full',
  'languages.js',
);
