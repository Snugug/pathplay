import { parseFromSearch } from '../utils/puppeteer.js';
import { manual } from './manual/conditions.js';

await parseFromSearch(
  'https://2e.aonprd.com/Search.aspx?include-types=condition&display=full',
  manual,
);
