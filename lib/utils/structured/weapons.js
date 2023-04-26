/* global _parseURLFromHref */
import { setup, setupPage } from '../puppeteer.js';
import { waitForAllResults } from '../utils.js';

let all = [];
const { browser } = await setup();
const p = await setupPage(
  browser,
  `https://2e.aonprd.com/Search.aspx?include-types=weapon&display=table&columns=weapon_type%2Cweapon_category%2Cweapon_group%2Ctrait%2Cdamage%2Chands%2Crange%2Creload%2Cbulk%2Cprice%2Crarity`,
);
await waitForAllResults(p);
all = await p.evaluate(() => {
  return [
    ...document
      .querySelector('#main > nethys-search')
      .shadowRoot.querySelectorAll(
        'div > div > div.column.gap-large.align-center > div:nth-child(2) > div > table tbody tr',
      ),
  ].map((tr) => {
    const tds = [...tr.querySelectorAll('td')];
    const url = _parseURLFromHref(tds[0].querySelector('a').href);
    const type = tds[1].innerText.trim();
    const category = tds[2].innerText.trim();
    const group = tds[3].innerText.trim();
    const damage = tds[5].innerText.trim();
    const hands = tds[6].innerText.trim();
    const range = tds[7].innerText.trim();
    const reload = tds[8].innerText.trim();
    const bulk = tds[9].innerText.trim();
    const price = {
      description: tds[10].innerText.trim(),
    };
    const priceRegex =
      /(\d+)\s(sp|gp|cp)(, (\d+)\s(sp|gp|cp))?(\s\((price )?for (\d+)(\s\w*)?)?/gi;
    const cost = priceRegex.exec(price.description);

    if (cost) {
      price.value = Number(cost[1]);

      if (cost[2] === 'sp') {
        price.value = price.value / 10;
      } else if (cost[2] === 'cp') {
        price.value = price.value / 100;
      }

      if (cost[4]) {
        if (cost[5] === 'sp') {
          price.value += Number(cost[4]) / 10;
        } else if (cost[5] === 'cp') {
          price.value += Number(cost[4]) / 100;
        } else {
          price.value += Number(cost[4]);
        }
      }

      if (cost[8]) {
        price.quantity = Number(cost[8]);

        if (cost[9]) {
          price.unit = cost[9].trim();
        }
      }
    } else {
      price.value = 0;
    }

    const results = {
      url,
      grouping: {
        type,
        category,
        group,
      },
      damage,
      hands,
      range,
      reload,
      bulk,
      price,
    };

    if (!results.damage) {
      delete results.damage;
    }
    if (!results.hands) {
      delete results.hands;
    }
    if (!results.range) {
      delete results.range;
    }
    if (!results.reload) {
      delete results.reload;
    }
    if (!results.bulk) {
      delete results.bulk;
    }

    return results;
  });
});
await p.close();
await browser.close();

export const weapons = all;
