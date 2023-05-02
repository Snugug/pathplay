import puppeteer from 'puppeteer';
import process from 'process';
import { parentPort } from 'worker_threads';
import { outputFile } from 'fs-extra/esm';
import { join } from 'path';
import { createRequire } from 'module';
import { sanitizeMarkdown } from './text.js';
import { logStart, logIncrement, setTotal } from './log.js';
import slugify from 'slugify';
import { globSync } from 'glob';
import {
  postprocessAncestry,
  postprocessClass,
  postprocessBackground,
  genericPostprocess,
} from './postprocess.js';
import { waitForAllResults } from './utils.js';
import pluralize from 'pluralize';

const require = createRequire(import.meta.url);

/**
 * Creates a set of browser and page objects
 * @return {Promise<{browser: Browser, page: Page}>}
 */
export async function setup() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', (message) => {
    if (!parentPort || process.env.NODE_ENV === 'development') {
      if (message.type() === 'info') {
        console.log(message.text());
      }
      // console.log(
      //   `${message.type().substring(0, 3).toUpperCase()} }`,
      // );
    }
  });

  return { browser, page };
}

/**
 * Cleanup browser and page objects
 * @param {Object} options
 * @param {Browser} browser
 * @param {Page} page
 */
export async function cleanup({ filename, data }, browser, page) {
  const functions = [];

  /**
   * Replaces functions with a string that can be replaced later
   * @param {string} key - key of the object
   * @param {*} val - value of the object
   * @return {*} - the value to be used in the output, or a string to be replaced later for a function
   */
  function pullFunction(key, val) {
    if (typeof val === 'function') {
      functions.push(val.toString());

      return `__${filename.replace(/-/g, '_')}_${functions.length - 1}`;
    }

    return val;
  }

  let indent = 2;

  if (parentPort?.postMessage) {
    indent = 0;
  }

  await outputFile(
    join('public', 'data', `${filename}.json`),
    JSON.stringify(data, pullFunction, indent),
  );

  if (functions.length) {
    await outputFile(
      join('public', 'data', `${filename}.js`),
      functions
        .map(
          (func, i) =>
            `export const __${filename.replace(/-/g, '_')}_${i} = ${func};`,
        )
        .join('\n'),
    );
  }

  await page.close();
  await browser.close();
}

/**
 *
 * @param {string} text Text to slugify
 * @return {string}
 */
function slug(text) {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'en',
  });
}

/**
 *
 * @param {PuppeteerPage} page
 * @param {string} url
 * @return {PuppeteerPage}
 */
export async function setupPage(page, url) {
  // const page = await browser.newPage();

  page.on('console', (message) => {
    if (!parentPort || process.env.NODE_ENV === 'development') {
      if (message.type() === 'info') {
        console.log(message.text());
      }
      // console.log(
      //   `${message.type().substring(0, 3).toUpperCase()} }`,
      // );
    }
  });

  await page.goto(url);

  const __dirname = new URL('.', import.meta.url).pathname;
  const parsers = globSync('parsers/*.js', { cwd: __dirname });
  for (const parser of parsers) {
    await page.addScriptTag({
      path: require.resolve(`./${parser}`),
    });
  }

  await page.exposeFunction('_slugify', slug);

  return page;
}

/**
 *
 * @param {string} url URL to search from
 * @param {object} manual Manual items to add to
 */
export async function parseFromSearch(url, manual = {}) {
  // Setup
  const { browser } = await setup();

  const page = await setupPage(browser, url);

  const { max } = await waitForAllResults(page);

  logStart(max);

  // Get all items
  const items = await Promise.all(
    (
      await page.evaluate(async () => {
        const items = [
          ...document
            .querySelector('#main > nethys-search')
            .shadowRoot.querySelectorAll('section.column'),
        ];

        return await Promise.all(
          items.map(async (item) => {
            const results = await _parseSharedInformation(item);

            // Class-specific stuff
            if (results.type === 'class') {
              return await _parseClasses(item, results);
            }

            // Background-specific stuff
            if (results.type === 'background') {
              return await _parseBackgrounds(item, results);
            }

            // Ancestries and versatile heritages
            if (
              results.type === 'ancestry' ||
              results.type === 'versatile-heritage'
            ) {
              return await _parseAncestry(item, results);
            }

            if (results.type === 'skill') {
              return await _parseSkill(item, results);
            }

            // Diety-specific stuff
            // Need favored weapon
            // Need domains
            // Need spells
            // Need font
            // Need skill
            // Need divine ability

            // Spell-specific stuff
            // Cast may have trigger (Air Bubble)
            // Cast may have requirements (Alarm)
            // Cast may have components (Augury)
            // Range may have area (Alarm)
            // Range may have target (Anathematic Reprisal)
            // May have dieties (Animal Form)
            // Range may only have area (Antimagic Field)
            // Need to handle traditions/spell lists/bloodlines

            // Skill-specific stuff
            // Feats

            return results;
          }),
        );
      })
    )
      .filter((item, i, arr) => i === arr.findIndex((t) => t.id === item.id))
      .map(async (item) => {
        let tweaked = {};

        if (manual.post) {
          const { id, slug } = item;
          tweaked = manual.post[id] || manual.post[slug];
        }

        if (tweaked?.traits) {
          tweaked.traits = tweaked.traits.map((t) => `/traits/${t}`);
        }

        switch (item.type) {
          case 'ancestry':
            await postprocessAncestry(item, setupPage, browser);
            break;
          case 'class':
            await postprocessClass(item, setupPage, browser);
            break;
          case 'background':
            await postprocessBackground(item);
            break;
          case 'weapon':
          case 'armor':
          case 'shield':
            await genericPostprocess(item);
            break;
          case 'half-human-heritage':
          case 'versatile-heritage':
            item.type = 'versatile-heritage';
            break;
          case 'armor-specialization':
          case 'weapon-critical-specialization':
            item.type = item.type.replace(
              /(-critical)?-specialization/,
              '-group',
            );
            break;
        }

        const final = Object.assign(item, tweaked);
        final.description = sanitizeMarkdown(final.description);
        if (final.sidebar) {
          final.sidebar = sanitizeMarkdown(final.sidebar);
        }

        if (final.features) {
          final.features = final.features.map((f) => {
            f.description = sanitizeMarkdown(f.description || '');
            return f;
          });
        }

        logIncrement();
        return item;
      }),
  );

  // Set total to total number of items, in case some are duplicates
  setTotal(items.length);

  const filename = items[0].type;

  return await cleanup(
    {
      filename,
      data: items,
    },
    browser,
    page,
  );
}