import slugify from 'slugify';
import { outputFile } from 'fs-extra/esm';
import { Cluster } from 'puppeteer-cluster';
import { globSync } from 'glob';

import { cpus } from 'os';
import { createRequire } from 'module';
import { join } from 'path';

const require = createRequire(import.meta.url);

export const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: cpus().length,
  retryLimit: 5,
  timeout: 600000,
});

cluster.on('taskerror', (err, data, willRetry) => {
  if (willRetry) {
    console.warn(
      `Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`,
    );
  } else {
    console.error('FULL ERROR');
    console.error(err);
    throw new Error(`Failed to crawl ${data}: ${err.message}`);
  }
});

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
export async function setup(page, url) {
  // const page = await browser.newPage();

  // page.on('console', (message) => {
  //   if (process.env.NODE_ENV === 'development') {
  //     if (message.type() === 'info') {
  //       console.log(message.text());
  //     }
  //   }
  // });

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
