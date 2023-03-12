import puppeteer from 'puppeteer';
import { outputFile } from 'fs-extra/esm';
import { join } from 'path';

/**
 * Creates a set of browser and page objects
 * @return {Promise<{browser: Browser, page: Page}>}
 */
export async function setup() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', (message) =>
    console.log(
      `${message.type().substring(0, 3).toUpperCase()} ${message.text()}`,
    ),
  );

  return { browser, page };
}

/**
 * Cleanup browser and page objects
 * @param {Object} options
 * @param {Browser} browser
 * @param {Page} page
 */
export async function cleanup({ filename, data }, browser, page) {
  await outputFile(
    join('public', 'data', filename),
    JSON.stringify(data, null, 2),
  );
  await page.close();
  await browser.close();
}
