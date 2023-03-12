import { outputFile } from 'fs-extra/esm';
import cliProgress from 'cli-progress';
import colors from 'ansi-colors';
import { createWorker } from './utils/workers.js';
import * as url from 'url';
import path from 'path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

(async () => {
  try {
    console.log('Gathering data...');
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
      // {
      //   url: 'equipment.js',
      //   title: 'Equipment',
      // },
      // {
      //   url: 'ancestries.js',
      //   title: 'Ancestries',
      // },
      // {
      //   url: 'archetypes.js',
      //   title: 'Archetypes',
      // },
      // {
      //   url: 'backgrounds.js',
      //   title: 'Backgrounds',
      // },
      // {
      //   url: 'classes.js',
      //   title: 'Classes',
      // },
      // {
      //   url: 'skills.js',
      //   title: 'Skills',
      // },
      // {
      //   url: 'feats.js',
      //   title: 'Feats',
      // },
      // {
      //   url: 'spells.js',
      //   title: 'Spells',
      // },
      {
        url: 'conditions.js',
        title: 'Conditions',
      },
      // {
      //   url: 'actions.js',
      //   title: 'Actions',
      // },
      // {
      //   url: 'languages.js',
      //   title: 'Languages',
      // },
      // {
      //   url: 'dieties.js',
      //   title: 'Dieties',
      // },
      // {
      //   url: 'domains.js',
      //   title: 'Domains',
      // },
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
    console.log('DONE');
  } catch (e) {
    console.error(e);
  }
})();
