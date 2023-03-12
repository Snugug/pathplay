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
      //   url: './scrapers/ancestries.js',
      //   title: 'Ancestries',
      // },
      // {
      //   url: './scrapers/archetypes.js',
      //   title: 'Archetypes',
      // },
      // {
      //   url: './scrapers/backgrounds.js',
      //   title: 'Backgrounds',
      // },
      // {
      //   url: './scrapers/classes.js',
      //   title: 'Classes',
      // },
      // {
      //   url: './scrapers/skills.js',
      //   title: 'Skills',
      // },
      // {
      //   url: './scrapers/feats.js',
      //   title: 'Feats',
      // },
      // {
      //   url: './scrapers/spells.js',
      //   title: 'Spells',
      // },
      // {
      //   url: './scrapers/conditions.js',
      //   title: 'Conditions',
      // },
      // {
      //   url: './scrapers/actions.js',
      //   title: 'Actions',
      // },
      // {
      //   url: './scrapers/languages.js',
      //   title: 'Languages',
      // },
      // {
      //   url: './scrapers/dieties.js',
      //   title: 'Dieties',
      // },
      // {
      //   url: './scrapers/domains.js',
      //   title: 'Domains',
      // },
      // {
      //   url: './scrapers/planes.js',
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
