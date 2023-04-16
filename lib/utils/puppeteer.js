import puppeteer from 'puppeteer';
import process from 'process';
import { parentPort } from 'worker_threads';
import { outputFile } from 'fs-extra/esm';
import { join } from 'path';
import { createRequire } from 'module';
import { sanitizeMarkdown } from './text.js';
import { logStart, logIncrement } from './log.js';
import slugify from 'slugify';
import { globSync } from 'glob';

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
      console.log(
        `${message.type().substring(0, 3).toUpperCase()} ${message.text()}`,
      );
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
 * @param {string} url URL to search from
 * @param {object} manual Manual items to add to
 */
export async function parseFromSearch(url, manual = {}) {
  // Setup
  const { browser, page } = await setup();

  // Go to URL, add browser additions
  await page.goto(url);

  // Add all parsers
  const __dirname = new URL('.', import.meta.url).pathname;
  const parsers = globSync('parsers/*.js', { cwd: __dirname });
  for (const parser of parsers) {
    await page.addScriptTag({
      path: require.resolve(`./${parser}`),
    });
  }

  await page.exposeFunction('_slugify', slug);

  // Get total
  let total = false;
  // Wait for it to load
  do {
    try {
      total = total = await (
        await page.evaluateHandle(
          `document.querySelector("#main > nethys-search").shadowRoot.querySelector("div > div > div.column.gap-large.align-center > div.limit-width.fill-width-with-padding.fade-in")`,
        )
      ).asElement();
    } catch (e) {
      total = false;
    }
  } while (total === false);

  let [current, max] = (
    await (await total.getProperty('textContent')).jsonValue()
  )
    .split(' of ')
    .map((x) => Number(x.replace(/\D*/g, '')));

  // Load all if not currently loaded
  if (current !== max) {
    // Get load all button
    const loadAll = await (
      await page.evaluateHandle(
        `document.querySelector("#main > nethys-search").shadowRoot.querySelector("div > div > div.column.gap-large.align-center > div.row.gap-medium > button:last-of-type")`,
      )
    ).asElement();
    await loadAll.click();

    do {
      current = (await (await total.getProperty('textContent')).jsonValue())
        .split(' of ')
        .map((x) => Number(x.replace(/\D*/g, '')))[0];
    } while (current !== max);
  }

  logStart(max);

  // Get all items
  const items = (
    await page.evaluate(async () => {
      /* global _parseSharedInformation, _parseClasses, _parseAncestry */
      const items = [
        ...document
          .querySelector('#main > nethys-search')
          .shadowRoot.querySelectorAll('section.column'),
      ];

      return await Promise.all(
        items.map(async (item) => {
          const results = await _parseSharedInformation(item);

          // Class-specific stuff
          if (results.type === 'classes') {
            return Object.assign(results, await _parseClasses(item));
          }

          if (results.type === 'ancestry') {
            return Object.assign(results, await _parseAncestry(item));
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

          // Weapon-specific stuff
          // price/damage/bulk/critical specialization

          // Ancestry-specific stuff

          // Skill-specific stuff
          // Feats

          return results;
        }),
      );
    })
  )
    .map((item) => {
      let tweaked = {};

      if (manual.post) {
        const { id, slug } = item;
        tweaked = manual.post[id] || manual.post[slug];
      }

      if (tweaked?.traits) {
        tweaked.traits = tweaked.traits.map((t) => `/traits/${t}`);
      }

      const final = Object.assign(item, tweaked);
      final.description = sanitizeMarkdown(final.description);
      if (final.sidebar) {
        final.sidebar = sanitizeMarkdown(final.sidebar);
      }

      logIncrement();
      return item;
    })
    .filter((item, i, arr) => i === arr.findIndex((t) => t.id === item.id));

  const filename = items[0].type;

  return cleanup(
    {
      filename,
      data: items,
    },
    browser,
    page,
  );
}
