import { cluster, parseFullSearch } from './utils/puppeteer.js';
import { Logger } from './utils/log.js';

const trait = 'background';

const logger = new Logger();
const bar = logger.bar('Manual');

await parseFullSearch(trait, bar);

await cluster.idle();
await cluster.close();
