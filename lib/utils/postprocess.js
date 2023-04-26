/* global _ref, _slugify, _parseSource, _parseTraits, _parseMeta, _parseChildNode, _parseFeatures */
import pluralize from 'pluralize';
import { sanitizeMarkdown } from './text.js';
import { waitForAllResults } from './utils.js';

pluralize.addSingularRule(/muses$/i, 'muse');

/**
 * Postprocess Ancestry
 * @param {Object} ancestry
 * @param {function} setupPage
 * @param {PuppeteerBrowser} browser
 */
export async function postprocessAncestry(ancestry, setupPage, browser) {
  const p = await setupPage(
    browser,
    `https://2e.aonprd.com/Heritages.aspx?Ancestry=${ancestry.id}`,
  );
  await p.waitForSelector('h1.title');
  const heritages = await p.evaluate(() => {
    /* global _parseURLFromHref */
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
          a.findIndex((t) => t.name.toLowerCase() === v.name.toLowerCase()) ===
          i,
      )
      .map((a) => a.url);
  });
  await p.close();
  ancestry.heritages = heritages;
}

/**
 * Postprocess Class
 * @param {Object} cls
 * @param {function} setupPage
 * @param {PuppeteerBrowser} browser
 */
export async function postprocessClass(cls, setupPage, browser) {
  let p = await setupPage(
    browser,
    `https://2e.aonprd.com/Classes.aspx?ID=${cls.id}`,
  );
  await p.waitForSelector(
    '#ctl00_RadDrawer1_Content_MainContent_SubNavigation',
  );
  const slink = await p.evaluate(() => {
    const subnav = [
      ...document.querySelectorAll(
        '#ctl00_RadDrawer1_Content_MainContent_SubNavigation a',
      ),
    ];
    const samples = subnav.findIndex((a) =>
      a.innerText.includes('Sample Builds'),
    );

    const slinks = [];

    for (let i = samples + 1; i < subnav.length; i++) {
      const a = subnav[i];
      slinks.push(a.innerText);
    }

    return slinks;
  });

  // Break early if there are no specializations
  if (!slink.length) {
    p.close();
    return;
  }

  // Clean up the specialization names and build
  const search =
    'https://2e.aonprd.com/Search.aspx?display=full&include-types=' +
    slink
      .map((s) => {
        // Remove plural, but make sure thesis isn't broken
        s = pluralize.singular(s);
        if (!s.includes(cls.name)) {
          s = cls.name + ' ' + s;
        }
        return s;
      })
      .join(';');

  p = await setupPage(browser, search);

  await waitForAllResults(p);

  cls.specializations = await p.evaluate(async () => {
    const items = [
      ...document
        .querySelector('#main > nethys-search')
        .shadowRoot.querySelectorAll('section.column'),
    ];

    return await Promise.all(
      items.map(async (item) => {
        const title = item.querySelector('h1 .title p a');
        const results = await _ref(title);
        results.rarity = 'common';

        const type = await _slugify(
          item
            .querySelector('h1 .title .align-right')
            .innerText.replace(/(\d)*\+?/g, ''),
        );

        if (results.type !== type) {
          results.type = type;
        }

        // Traits and source don't work for Witch; neeed to look into this
        // https://2e.aonprd.com/Search.aspx?include-types=witch%20lesson%3Bwitch%20patron%20theme&display=list

        // Traits

        const { rarity, alignment, traits } = await _parseTraits([
          ...item.querySelectorAll('h1:has(.title) + .traits a'),
        ]);

        if (rarity) {
          results.rarity = rarity;
        }

        if (traits.length) {
          results.traits = traits;
        }

        if (alignment.length) {
          results.alignment = alignment;
        }

        // Source
        const source =
          item.querySelector('.traits + .column > .row p') ||
          item.querySelector('h1:has(.title) + div.row:not(.traits)') ||
          item.querySelector('h1:has(.title) + .traits + .row.gap-tiny p');

        if (source) {
          results.source = _parseSource(source);
        }

        // Meta
        const meta = await _parseMeta([
          ...item.querySelectorAll('h1 + .traits + .column > p'),
        ]);

        if (meta.length) {
          results.meta = meta;
        }

        // Features
        // h2.column
        results.description = '';
        const body = [...item.childNodes];
        const start = body.findIndex((n) =>
          n.isEqualNode(
            item.querySelector(
              'h1:has(.title) ~ :not(.row):not(.column):not(hr):first-of-type',
            ),
          ),
        );

        const feature = item.querySelector('h1:has(.title) ~ h2.column');
        let end = body.findIndex((n) => n.isEqualNode(feature));
        if (end >= 0) {
          end;
        } else {
          end = body.length;
        }

        for (let i = start; i < end; i++) {
          results.description += _parseChildNode(body[i]);
        }

        // Only testing against Gunslinger and Inventor
        if (feature) {
          results.features = [];

          const features = [
            ...item.querySelectorAll('h1:has(.title) ~ h2.column'),
          ];

          results.features = _parseFeatures(features, body);
        }

        return results;
      }),
    );
  });

  cls.specializations.map((s) => {
    s.description = sanitizeMarkdown(s.description);

    if (s.features) {
      s.featured = s.features.map((f) => {
        f.description = sanitizeMarkdown(f.description);
        return f;
      });
    }

    return s;
  });

  await p.close();
}

/**
 * Postprocess backgrounds
 * @param {Object} background
 * @return {Object}
 */
export async function postprocessBackground(background) {
  const { backgrounds } = await import('./structured/backgrounds.js');

  const { skills, feats, lore } = backgrounds.find(
    (b) => b.url === background.url,
  );
  if (background.skills) {
    if (skills.length) {
      background.skills = skills;
    } else {
      background.skills = 'manual';
    }
  } else {
    delete background.skills;
  }

  if (background.feats) {
    if (feats.length) {
      background.feats = feats;
    } else {
      background.feats = 'manual';
    }
  } else {
    delete background.feats;
  }

  if (lore) {
    background.lore = lore;
  }

  return background;
}

/**
 * Postprocess backgrounds
 * @param {Object} weapon
 * @return {Object}
 */
export async function postprocessWeapon(weapon) {
  const { weapons } = await import('./structured/weapons.js');
  const meta = weapons.find((b) => b.url === weapon.url);

  for (const [key, value] of Object.entries(meta)) {
    weapon[key] = value;
  }
}
