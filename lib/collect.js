import { outputFile } from 'fs-extra/esm';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import { createWorker } from './utils/workers.js';
import * as url from 'url';
import path from 'path';
import { PerformanceObserver, performance } from 'perf_hooks';

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

    await outputFile(
      'public/data/meta.json',
      JSON.stringify(
        {
          lastUpdated: new Date().toISOString(),
        },
        null,
        2,
      ),
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
      // Need to deal with price/damage/bulk/favored weapon for weapons, as well as group and critical specialization effects
      // {
      //   url: 'weapons.js',
      //   title: 'Weapons',
      // },
      // {
      //   url: 'shields.js',
      //   title: 'Shields',
      // },
      // Ancestries need special handling
      // {
      //   url: 'ancestries.js',
      //   title: 'Ancestries',
      // },
      // {
      //   url: 'archetypes.js',
      //   title: 'Archetypes',
      // },
      {
        url: 'backgrounds.js',
        title: 'Backgrounds',
      },
      // Classes need special handling
      // {
      //   url: 'classes.js',
      //   title: 'Classes',
      // },
      // Skills need special handling
      // {
      //   url: 'skills.js',
      //   title: 'Skills',
      // },
      {
        url: 'feats.js',
        title: 'Feats',
      },
      // Need special handling for cast time and components.
      // Cast may have trigger (Air Bubble)
      // Cast may have requirements (Alarm)
      // Cast may have components (Augury)
      // Range may have area (Alarm)
      // Range may have target (Anathematic Reprisal)
      // May have dieties (Animal Form)
      // Range may only have area (Antimagic Field)
      // Need to handle traditions/spell lists/bloodlines
      // {
      //   url: 'spells.js',
      //   title: 'Spells',
      // },
      // {
      //   url: 'focus.js',
      //   title: 'Focus',
      // },
      // Need to handle Dieties and Apocryphal spells
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
      // Need to handle alignment
      // Need to handle images
      // {
      //   url: 'dieties.js',
      //   title: 'Dieties',
      // },
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
  } catch (e) {
    console.error(e);
  }
})();
