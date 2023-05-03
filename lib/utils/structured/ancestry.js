import { parseURL } from '../puppeteer.js';

/**
 *
 * @param {Object} ancestry
 */
export async function process(ancestry) {
  const url = `https://2e.aonprd.com/Heritages.aspx?Ancestry=${ancestry.id}`;
  const heritages = await parseURL(url, async (page) => {
    await page.waitForSelector('h1.title');
    return await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2.title a')]
        .filter((a) => a.href.includes('Heritage'))
        .map((a) => ({
          name: a.textContent,
          url: _parseURLFromHref(a.href),
        }));
      const a = [...document.querySelectorAll('b + u a')].map((a) => ({
        name: a.textContent,
        url: _parseURLFromHref(a.href),
      }));

      // Remove duplicates
      return [...a, ...h]
        .filter(
          (v, i, a) =>
            a.findIndex(
              (t) => t.name.toLowerCase() === v.name.toLowerCase(),
            ) === i,
        )
        .map((a) => a.url);
    });
  });

  ancestry.heritages = heritages;
}
