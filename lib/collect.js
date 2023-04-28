import { outputFile } from 'fs-extra/esm';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import { Worker } from 'node:worker_threads';
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
      {
        url: 'weapons.js',
        title: 'Weapons',
      },
      {
        url: 'weapon-groups.js',
        title: 'Weapon Groups',
      },
      {
        url: 'armor.js',
        title: 'Armor',
      },
      {
        url: 'armor-groups.js',
        title: 'Armor Groups',
      },
      {
        url: 'shields.js',
        title: 'Shields',
      },
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
      {
        url: 'skills.js',
        title: 'Skills',
      },
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
    ]
      .map((scraper) => ({
        title: scraper.title,
        url: path.join(__dirname, 'collectors', scraper.url),
      }))
      .reduce((acc, cur, i, a) => {
        const chunk = Math.ceil(a.length / 10);
        const index = Math.floor(i / chunk);
        if (!acc[index]) {
          acc[index] = [];
        }
        acc[index].push(cur);

        return acc;
      }, []);

    const overall = progress.create(scrapers.length, 0, {
      title: 'Threads',
    });

    await Promise.all(
      scrapers.map(
        (s, i) =>
          new Promise((resolve, reject) => {
            const worker = new Worker('./utils/workers.js', {
              workerData: s,
            });
            const bar = progress.create(0, -1, {
              title: `Thread ${i}`.padEnd(19, ' '),
            });
            let opts = {};
            worker.on('message', (e) => {
              if (e.title) {
                opts = {
                  title: e.title.padEnd(19, ' '),
                };
              } else if (e.start) {
                bar.start(e.start, 0, opts);
              } else if (e.total) {
                bar.setTotal(e.total);
              } else {
                bar.increment(1);
              }
            });
            worker.on('error', (e) => reject(e));
            worker.on('exit', (code) => {
              if (code !== 0) {
                console.error(
                  new Error(`Worker stopped with exit code ${code}`),
                );
                reject(code);
              } else {
                bar.stop();
                overall.increment(1);
                progress.remove(bar);
                resolve(1);
              }
            });
          }),
      ),
    );

    overall.stop();

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
