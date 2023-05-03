import { parseSearchPage } from '../puppeteer.js';

export const processed = await parseSearchPage(
  `https://2e.aonprd.com/Search.aspx?include-types=armor&display=table&columns=armor_category%2Cac%2Cdex_cap%2Ccheck_penalty%2Cspeed_penalty%2Cstrength_req%2Cbulk%2Carmor_group%2Ctrait%2Cprice`,
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
        const category = tds[1].innerText.trim();
        const group = tds[8].querySelector('a')
          ? _parseURLFromHref(tds[8].querySelector('a').href)
          : false;
        const ac = Number(tds[2].innerText.trim());
        const dexCap = tds[3].innerText.trim()
          ? Number(tds[3].innerText.trim())
          : false;
        const checkPenalty = Number(tds[4].innerText.trim());
        const speedPenalty = _parseSpeedPenalty(tds[5].innerText.trim());

        const strengthReq = tds[6].innerText.trim()
          ? Number(tds[6].innerText.trim())
          : false;
        const bulk = _parseBulk(tds[7].innerText.trim());
        const price = _parsePrice(tds[10].innerText.trim());

        const results = {
          url,
          grouping: {
            category,
            group,
          },
          ac,
          cap: dexCap,
          check: checkPenalty,
          speed: speedPenalty,
          strength: strengthReq,
          bulk,
          price,
        };

        return results;
      });
    });
  },
);
