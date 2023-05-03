import { outputFile } from 'fs-extra/esm';
import { Cluster } from 'puppeteer-cluster';
import { globSync } from 'glob';

import { cpus } from 'os';
import { createRequire } from 'module';
import { join } from 'path';
import * as url from 'url';

import { waitForAllResults, slug } from './utils.js';

import { advancedPostprocess, genericPostprocess } from './postprocess.js';
import { sanitizeMarkdown } from './text.js';

const require = createRequire(import.meta.url);

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: cpus().length,
  retryLimit: 5,
  timeout: 600000,
});

cluster.on('taskerror', (err, data, willRetry) => {
  if (willRetry) {
    // console.warn(
    //   `Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`,
    // );
  } else {
    console.error('FULL ERROR');
    console.error(err);
    throw new Error(`Failed to crawl ${data}: ${err.message}`);
  }
});

/**
 *
 * @param {PuppeteerPage} page
 * @param {string} url
 * @return {PuppeteerPage}
 */
export async function setup(page, url) {
  page.on('console', (message) => {
    if (process.env.NODE_ENV === 'development') {
      if (message.type() === 'info') {
        console.log(message.text());
      }
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
 * Cleanup browser and page objects
 * @param {object} data
 * @param {string} filename
 */
export async function output(data, filename) {
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

  const indent = 2;

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
}

/**
 * Parsing for search results page
 * @param {string} url URL to parse
 * @param {function} cb callback function
 * @return {Promise<*>} Results
 */
export function parseSearchPage(url, cb) {
  return parseURL(url, async (page) => {
    const { max } = await waitForAllResults(page);
    try {
      return await cb(page, max);
    } catch (e) {
      throw new Error(e);
    }
  });
}

/**
 * Parsing for any page
 * @param {string} url URL to parse
 * @param {function} cb callback function
 * @return {Promise<*>} Results
 */
export function parseURL(url, cb) {
  return new Promise((resolve, reject) => {
    cluster.queue(url, async ({ page: p, data: url }) => {
      const page = await setup(p, url);
      try {
        resolve(await cb(page));
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 *
 * @param {string} type Types to search on
 * @param {object} log Logger
 */
export async function parseFullSearch(type, log) {
  let m;
  const items = (
    await parseSearchPage(
      `https://2e.aonprd.com/Search.aspx?include-types=${type}&display=full`,
      (page, max) => {
        m = max;
        log.start(max);
        return page.evaluate(async () => {
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

              return results;
            }),
          );
        });
      },
    )
  ).filter((item, i, arr) => i === arr.findIndex((t) => t.id === item.id));

  if (items.length !== m) {
    log.start(items.length);
  }

  const results = await Promise.all(
    items.map(async (item) => {
      switch (item.type) {
        case 'ancestry':
        case 'class':
        case 'background':
          await advancedPostprocess(item);
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

      // Manual tweaks
      let tweaked = {};
      try {
        const { default: manual } = await import(
          join(__dirname, '../data', `${item.type}.js`)
        );

        tweaked = manual[item.id] || manual[item.slug] || {};

        if (tweaked?.traits) {
          tweaked.traits = tweaked.traits.map((t) => `/traits/${t}`);
        }
      } catch (e) {
        // Ignore
      }

      // Final construction
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

      log.increment();
      return item;
    }),
  );

  await output(results, results[0].type);
  log.stop();
}
