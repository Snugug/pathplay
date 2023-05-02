import { cluster, setup, output } from './puppeteer.js';
import { waitForAllResults } from './utils.js';
import { logStart, logIncrement, setTotal } from './log.js';
import { sanitizeMarkdown } from './text.js';
import { genericPostprocess } from './postprocess.js';

/**
 *
 * @param {ClusterProcess} param0
 */
async function parse({ page: p, data: url }) {
  const page = await setup(p, url);
  const { max } = await waitForAllResults(page);

  logStart(max);

  const items = await Promise.all(
    (
      await Promise.all(
        await page.evaluate(async () => {
          const items = [
            ...document
              .querySelector('#main > nethys-search')
              .shadowRoot.querySelectorAll('section.column'),
          ];

          return await Promise.all(
            items.map(async (item) => {
              const results = await _parseSharedInformation(item);

              // Class-specific stuff
              if (results.type === 'class') {
                return await _parseClasses(item, results);
              }

              // Background-specific stuff
              if (results.type === 'background') {
                return await _parseBackgrounds(item, results);
              }

              // Ancestries and versatile heritages
              if (
                results.type === 'ancestry' ||
                results.type === 'versatile-heritage'
              ) {
                return await _parseAncestry(item, results);
              }

              if (results.type === 'skill') {
                return await _parseSkill(item, results);
              }

              return results;
            }),
          );
        }),
      )
    )
      .filter((item, i, arr) => i === arr.findIndex((t) => t.id === item.id))
      .map(async (item) => {
        const tweaked = {};

        // if (manual.post) {
        //   const { id, slug } = item;
        //   tweaked = manual.post[id] || manual.post[slug];
        // }

        if (tweaked?.traits) {
          tweaked.traits = tweaked.traits.map((t) => `/traits/${t}`);
        }

        switch (item.type) {
          //   case 'ancestry':
          //     await postprocessAncestry(item, setupPage, browser);
          //     break;
          //   case 'class':
          //     await postprocessClass(item, setupPage, browser);
          //     break;
          //   case 'background':
          //     await postprocessBackground(item);
          //     break;
          //   case 'weapon':
          //   case 'armor':
          case 'shield':
            await genericPostprocess(item);
            break;
          //   case 'half-human-heritage':
          //   case 'versatile-heritage':
          //     item.type = 'versatile-heritage';
          //     break;
          //   case 'armor-specialization':
          //   case 'weapon-critical-specialization':
          //     item.type = item.type.replace(
          //       /(-critical)?-specialization/,
          //       '-group',
          //     );
          //     break;
        }

        const final = Object.assign(item, tweaked);
        final.description = sanitizeMarkdown(final.description);
        if (final.sidebar) {
          final.sidebar = sanitizeMarkdown(final.sidebar);
        }

        if (final.features) {
          final.features = final.features.map((f) => {
            f.description = sanitizeMarkdown(f.description || '');
            return f;
          });
        }

        logIncrement();
        return item;
      }),
  );

  setTotal(items.length);

  // const results = await Promise.all(
  //   items,
  // );

  await output(items, items[0].type);
  // } catch (e) {
  //   console.log(url);
  //   console.error(e);
  // }
}

[
  'feat',
  'item',
  'action',
  'ancestry',
  'armor%20specialization',
  'armor',
  'background',
  'class',
  'condition',
  'deity',
  'heritage',
  'language',
  'shield',
  'skill',
  'trait',
  'half-human%20heritage%3Bversatile%20heritage',
  'weapon%20critical%20specialization',
  'weapon',
].map((type) =>
  cluster.queue(
    `https://2e.aonprd.com/Search.aspx?include-types=${type}&display=full`,
    parse,
  ),
);

await cluster.idle();
await cluster.close();
