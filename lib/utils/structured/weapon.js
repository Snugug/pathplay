import { parseSearchPage } from '../puppeteer.js';

export const processed = await parseSearchPage(
  `https://2e.aonprd.com/Search.aspx?include-types=weapon&display=table&columns=weapon_type%2Cweapon_category%2Cweapon_group%2Ctrait%2Cdamage%2Chands%2Crange%2Creload%2Cbulk%2Cprice%2Crarity`,
  async (page) => {
    return await page.evaluate(() => {
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
        const group = tds[3].innerText.trim()
          ? _parseURLFromHref(tds[3].querySelector('a').href)
          : null;
        const damage = tds[5].innerText.trim();
        const hands = tds[6].innerText.trim();
        const range = tds[7].innerText.trim();
        const reload = tds[8].innerText.trim();
        const bulk = _parseBulk(tds[9].innerText.trim());
        const price = _parsePrice(tds[10].innerText.trim());

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
        if (!results.group) {
          delete results.group;
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
  },
);
