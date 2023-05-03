import pluralize from 'pluralize';
import { parseURL, parseSearchPage } from '../puppeteer.js';
import { sanitizeMarkdown } from '../text.js';

/**
 *
 * @param {Object} cls
 */
export async function process(cls) {
  const url = `https://2e.aonprd.com/Classes.aspx?ID=${cls.id}`;
  const slinks = await parseURL(url, async (page) => {
    await page.waitForSelector(
      '#ctl00_RadDrawer1_Content_MainContent_SubNavigation',
    );
    return await page.evaluate(() => {
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
  });

  if (!slinks.length) {
    return;
  }

  // Clean up the specialization names and build
  const search =
    'https://2e.aonprd.com/Search.aspx?display=full&include-types=' +
    slinks
      .map((s) => {
        // Remove plural, but make sure thesis isn't broken
        s = pluralize.singular(s);
        if (!s.includes(cls.name)) {
          s = cls.name + ' ' + s;
        }
        return s;
      })
      .join(';');

  const specializations = await parseSearchPage(search, async (page) =>
    page.evaluate(async () => {
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
    }),
  );

  cls.specializations = specializations.map((s) => {
    s.description = sanitizeMarkdown(s.description);

    if (s.features) {
      s.featured = s.features.map((f) => {
        f.description = sanitizeMarkdown(f.description);
        return f;
      });
    }

    return s;
  });
}
