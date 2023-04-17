import { outputFile } from 'fs-extra/esm';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import { createWorker } from './utils/workers.js';
import * as url from 'url';
import path from 'path';
import { PerformanceObserver, performance } from 'perf_hooks';
import { globSync } from 'glob';
import { createHash } from 'crypto';
import { readFileSync, statSync } from 'fs';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const obs = new PerformanceObserver((items) => {
  const raw = items.getEntries()[0].duration;
  let duration = raw;

  if (raw > 1000) {
    duration = raw / 1000;
  }

  console.log(
    `Finished updating data in ${colors.yellow(
      Math.round(duration),
    )}${colors.yellow(raw > 1000 ? 's' : 'ms')}`,
  );
  performance.clearMarks();
});

(async () => {
  try {
    obs.observe({ type: 'measure' });
    performance.mark('A');
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

    const scrapers = [
      {
        url: 'traits.js',
        title: 'Traits',
      },
      {
        url: 'items.js',
        title: 'Items',
      },
      // {
      //   url: 'weapons.js',
      //   title: 'Weapons',
      // },
      // {
      //   url: 'shields.js',
      //   title: 'Shields',
      // },
      {
        url: 'ancestries.js',
        title: 'Ancestries',
      },
      {
        url: 'versatile.js',
        title: 'Versatile Heritages',
      },
      {
        url: 'heritages.js',
        title: 'Heritages',
      },
      // {
      //   url: 'archetypes.js',
      //   title: 'Archetypes',
      // },
      {
        url: 'backgrounds.js',
        title: 'Backgrounds',
      },
      {
        url: 'classes.js',
        title: 'Classes',
      },
      // Skills need special handling
      // {
      //   url: 'skills.js',
      //   title: 'Skills',
      // },
      {
        url: 'feats.js',
        title: 'Feats',
      },

      // {
      //   url: 'spells.js',
      //   title: 'Spells',
      // },
      // {
      //   url: 'focus.js',
      //   title: 'Focus',
      // },

      // {
      //   url: 'domains.js',
      //   title: 'Domains',
      // },
      {
        url: 'conditions.js',
        title: 'Conditions',
      },
      {
        url: 'actions.js',
        title: 'Actions',
      },
      {
        url: 'languages.js',
        title: 'Languages',
      },
      {
        url: 'dieties.js',
        title: 'Dieties',
      },
      // Need to handle alignment, divinities, and native inhabitants
      // {
      //   url: 'planes.js',
      //   title: 'Planes',
      // },
    ].map((scraper) => ({
      title: scraper.title,
      url: path.join(__dirname, 'collectors', scraper.url),
    }));

    await Promise.all(
      scrapers.map((scraper) => createWorker(scraper, progress)),
    );

    progress.stop();
    performance.measure('Start to End', 'A');

    // Get all files that were created

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
  } catch (e) {
    console.error(e);
  }
})();

/**
 * Builds hash, size, and type for files
 * @param {string} f File path
 * @return {object}
 */
function buildFileMeta(f) {
  const data = readFileSync(f);
  const hash = createHash('sha256');
  hash.update(data);
  const hex = hash.digest('hex');

  return {
    path: f.replace('public/', ''),
    hash: hex,
    type: path.basename(f).split('.')[0],
    size: statSync(f).size,
  };
}
