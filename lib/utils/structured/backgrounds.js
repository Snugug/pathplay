import { setup, setupPage } from '../puppeteer.js';
import { waitForAllResults } from '../utils.js';

let all = [];
const { browser } = await setup();
const p = await setupPage(
  browser,
  `https://2e.aonprd.com/Search.aspx?include-types=background&display=table&columns=skill%2Cfeat`,
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
    const skills = [];
    const hasSkills = tds[1].querySelector('p');
    let lore = '';
    let body = [];
    if (hasSkills) {
      body = [...hasSkills.childNodes];
      lore = hasSkills.innerText;
    }

    for (let i = 0; i < body.length; i++) {
      const n = body[i];
      if (
        n.nodeName === 'A' &&
        !n.innerText.includes('Lore') &&
        n.href.includes('Skills.aspx')
      ) {
        const skill = _parseURLFromHref(n.href);
        let replace = n.innerText.trim();
        if (
          n.nextSibling &&
          n.nextSibling.textContent.includes(' or ') &&
          n.nextSibling.nextSibling.nodeName === 'A'
        ) {
          replace += ' or ';
        }
        lore = lore.replace(replace, '');
        skills.push(skill);
        // }
      }
    }

    lore = lore
      .replace(/Lore skill/g, '')
      .replace(/ Lore/g, '')
      .replace(/Lore /g, '')
      .replace('Survival', '')
      .replace('or a  related either to', 'or')
      .split(', ')
      .filter((a) => a)
      .join(', ')
      .trim()
      .replace(/^Lore/, '')
      .replace(/Lore$/, '')
      .replace(/^,/, '')
      .replace(/,$/, '')
      .replace(/\.$/, '')
      .replace(' and the ', ' and ')
      .replace(/skill( appropriate)?/, '')
      .trim()
      .replace(/^for a/, 'A')
      .replace(/^for an/, 'An')
      .replace(/^for the/, 'The')
      .replace(/^of the/, 'The')
      .replace(/^for your/, 'Your')
      .trim();

    lore = lore.charAt(0).toUpperCase() + lore.slice(1);

    if (lore.includes(' and ')) {
      lore = lore.split(' and ');
    } else if (lore) {
      lore = [lore];
    }

    const feats = [...tds[2].querySelectorAll('a')].map((a) =>
      _parseURLFromHref(a.href),
    );

    return {
      url,
      skills,
      feats,
      lore,
    };
  });
});
await p.close();
await browser.close();

export const processed = all;
