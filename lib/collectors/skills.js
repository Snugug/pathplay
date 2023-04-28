import { parseFromSearch } from '../utils/puppeteer.js';
import { manual } from './manual/skills.js';

await parseFromSearch(
  'https://2e.aonprd.com/Search.aspx?include-types=skill&display=full',
  manual,
);
