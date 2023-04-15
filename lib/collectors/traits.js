import { parseFromSearch } from '../utils/puppeteer.js';
import { manual } from './manual/traits.js';

await parseFromSearch(
  'https://2e.aonprd.com/Search.aspx?include-types=trait&display=full',
  manual,
);
