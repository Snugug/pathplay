import { parseSearchPage } from '../puppeteer.js';

export const processed = await parseSearchPage(
  `https://2e.aonprd.com/Search.aspx?include-types=shield&display=table&columns=price%2Cbulk%2Chp%2Cac%2Chardness%2Cspeed_penalty`,
  (page) => {
    return page.evaluate(() => {
      return [
        ...document
          .querySelector('#main > nethys-search')
          .shadowRoot.querySelectorAll(
            'div > div > div.column.gap-large.align-center > div:nth-child(2) > div > table tbody tr',
          ),
      ].map((tr) => {
        const tds = [...tr.querySelectorAll('td')];
        const url = _parseURLFromHref(tds[0].querySelector('a').href);

        // const group = tds[8].querySelector('a')
        //   ? _parseURLFromHref(tds[8].querySelector('a').href)
        //   : false;
        const ac = Number(tds[4].innerText.trim());
        const speedPenalty = _parseSpeedPenalty(tds[6].innerText.trim());
        const hardness = Number(tds[5].innerText.trim());
        const bulk = _parseBulk(tds[2].innerText.trim());
        const price = _parsePrice(tds[1].innerText.trim());

        const hp = tds[3].innerText.trim();
        const hpRegex = /(\d+) \((\d+)\)/;
        const hpMatch = hpRegex.exec(hp);

        const results = {
          url,
          ac,
          speed: speedPenalty,
          bulk,
          price,
          hardness,
          hp: Number(hpMatch[1]),
          bt: Number(hpMatch[2]),
        };

        return results;
      });
    });
  },
);
