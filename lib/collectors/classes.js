import { parseFromSearch } from '../utils/puppeteer.js';
import { manual } from './manual/classes.js';

await parseFromSearch(
  'https://2e.aonprd.com/Search.aspx?include-types=class&display=full',
  manual,
);
