import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import { globSync } from 'glob';
import { outputFile } from 'fs-extra/esm';

import { PerformanceObserver, performance } from 'perf_hooks';

import { cluster, parseFullSearch } from './utils/puppeteer.js';
import { Logger } from './utils/log.js';
import { buildFileMeta } from './utils/utils.js';

// Set up observers
const obs = new PerformanceObserver((items) => {
  const raw = items.getEntries()[0].duration;
  let duration = raw;
  let unit = 'ms';

  if (raw > 1000) {
    duration = raw / 1000;
    unit = 's';
  }

  if (duration > 60) {
    const min = Math.floor(duration / 60);
    const sec = Math.round(duration % 60);
    duration = `${min}m ${sec}s`;
    // duration = ;
  } else {
    duration = Math.round(duration) + unit;
  }

  console.log(`Finished updating data in ${colors.yellow(duration)}`);
  performance.clearMarks();
});

obs.observe({ type: 'measure' });
performance.mark('A');

// Set up progress bars
const progress = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: `${colors.cyan(
      '{bar}',
    )} | {title} | {eta_formatted} | {value}/{total}`,
    autopadding: true,
  },
  cliProgress.Presets.shades_classic,
);

const logger = new Logger(progress);

// Run the scraping cluster
await Promise.all(
  [
    { type: 'ancestry', title: 'Ancestry' },
    { type: 'class', title: 'Classes' },
    { type: 'feat', title: 'Feats' },
    { type: 'item', title: 'Items' },
    { type: 'action', title: 'Actions' },
    { type: 'armor specialization', title: 'Armor Groups' },
    { type: 'armor', title: 'Armor' },
    { type: 'background', title: 'Backgrounds' },
    { type: 'condition', title: 'Conditions' },
    { type: 'deity', title: 'Deities' },
    { type: 'heritage', title: 'Heritages' },
    { type: 'language', title: 'Languages' },
    { type: 'shield', title: 'Shields' },
    { type: 'skill', title: 'Skills' },
    { type: 'trait', title: 'Traits' },
    {
      type: 'half-human heritage;versatile heritage',
      title: 'Versatile Heritages',
    },
    { type: 'weapon critical specialization', title: 'Weapon Groups' },
    { type: 'weapon', title: 'Weapons' },
  ]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(({ type, title }) => {
      const log = logger.bar(title);
      return parseFullSearch(type, log);
    }),
);

await cluster.idle();
await cluster.close();

progress.stop();
performance.measure('Start to End', 'A');

const data = globSync('public/data/**/*.json').map(buildFileMeta);
const functions = globSync('public/data/**/*.js').map(buildFileMeta);

await outputFile(
  'public/data/meta.json',
  JSON.stringify({
    lastUpdated: new Date().toISOString(),
    data,
    functions,
  }),
);
