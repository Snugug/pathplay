import puppeteer from 'puppeteer';
import process from 'process';
import { parentPort } from 'worker_threads';
import { outputFile } from 'fs-extra/esm';
import { join } from 'path';
import { createRequire } from 'module';
import { sanitizeMarkdown } from './text.js';
import { logStart, logIncrement } from './log.js';
import slugify from 'slugify';

const require = createRequire(import.meta.url);

/**
 * Creates a set of browser and page objects
 * @return {Promise<{browser: Browser, page: Page}>}
 */
export async function setup() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', (message) => {
    if (!parentPort || process.env.NODE_ENV === 'development') {
      console.log(
        `${message.type().substring(0, 3).toUpperCase()} ${message.text()}`,
      );
    }
  });

  return { browser, page };
}

/**
 * Cleanup browser and page objects
 * @param {Object} options
 * @param {Browser} browser
 * @param {Page} page
 */
export async function cleanup({ filename, data }, browser, page) {
  const functions = [];

  /**
   * Replaces functions with a string that can be replaced later
   * @param {string} key - key of the object
   * @param {*} val - value of the object
   * @return {*} - the value to be used in the output, or a string to be replaced later for a function
   */
  function pullFunction(key, val) {
    if (typeof val === 'function') {
      functions.push(val.toString());

      return `__${filename.replace(/-/g, '_')}_${functions.length - 1}`;
    }

    return val;
  }

  let indent = 2;

  if (parentPort?.postMessage) {
    indent = 0;
  }

  await outputFile(
    join('public', 'data', `${filename}.json`),
    JSON.stringify(data, pullFunction, indent),
  );

  if (functions.length) {
    await outputFile(
      join('public', 'data', `${filename}.js`),
      functions
        .map(
          (func, i) =>
            `export const __${filename.replace(/-/g, '_')}_${i} = ${func};`,
        )
        .join('\n'),
    );
  }

  await page.close();
  await browser.close();
}

/**
 *
 * @param {string} text Text to slugify
 * @return {string}
 */
function slug(text) {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'en',
  });
}

/**
 *
 * @param {string} url URL to search from
 * @param {object} manual Manual items to add to
 */
export async function parseFromSearch(url, manual = {}) {
  // Setup
  const { browser, page } = await setup();

  // Go to URL, add browser additions
  await page.goto(url);
  await page.addScriptTag({
    path: require.resolve('./browser.js'),
  });
  await page.exposeFunction('_slugify', slug);

  // Get total
  let total = false;
  // Wait for it to load
  do {
    try {
      total = total = await (
        await page.evaluateHandle(
          `document.querySelector("#main > nethys-search").shadowRoot.querySelector("div > div > div.column.gap-large.align-center > div.limit-width.fill-width-with-padding.fade-in")`,
        )
      ).asElement();
    } catch (e) {
      total = false;
    }
  } while (total === false);

  let [current, max] = (
    await (await total.getProperty('textContent')).jsonValue()
  )
    .split(' of ')
    .map((x) => Number(x.replace(/\D*/g, '')));

  // Load all if not currently loaded
  if (current !== max) {
    // Get load all button
    const loadAll = await (
      await page.evaluateHandle(
        `document.querySelector("#main > nethys-search").shadowRoot.querySelector("div > div > div.column.gap-large.align-center > div.row.gap-medium > button:last-of-type")`,
      )
    ).asElement();
    await loadAll.click();

    do {
      current = (await (await total.getProperty('textContent')).jsonValue())
        .split(' of ')
        .map((x) => Number(x.replace(/\D*/g, '')))[0];
    } while (current !== max);
  }

  logStart(max);

  // Get all items
  const items = (
    await page.evaluate(async () => {
      /* global _parseIdFromHref, _parseChildNode, _findElementByText, _parseTraining, _ref */
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

          console.log(results.name);

          const level = item
            .querySelector('h1 .title .align-right')
            ?.textContent?.split(' ')[1];

          const isTwoColumn = item.querySelector('h1 + .row > .column');

          if (level) {
            results.level = Number(level);
          }

          // Actions
          let actions = item.querySelector(
            '.title a ~ span span.icon-font',
          )?.textContent;
          if (actions) {
            switch (actions) {
              case '[free-action]':
                actions = 0;
                break;
              case '[one-action]':
                actions = 1;
                break;
              case '[two-actions]':
                actions = 2;
                break;
              case '[three-actions]':
                actions = 3;
                break;
              case '[reaction]':
                actions = 'reaction';
                break;
              default:
                console.log(actions);
            }
            results.actions = actions;
          }

          // Traits
          const { alignment, traits } = await [
            ...item.querySelectorAll('.traits a'),
          ].reduce(
            async (acc, cur) => {
              acc = await acc;

              const alignment =
                cur.parentElement.classList.contains('trait-alignment');
              const rarity =
                cur.parentElement.classList.contains('trait-rare') ||
                cur.parentElement.classList.contains('trait-uncommon');

              const trait = await _ref(cur);

              if (rarity) {
                results.rarity = trait.slug;
              } else if (alignment) {
                if (acc.alignment.indexOf((t) => t.id === trait.id) === -1) {
                  acc.alignment.push(trait.url);
                }
              } else {
                if (acc.traits.indexOf((t) => t.id === trait.id) === -1) {
                  acc.traits.push(trait.url);
                }
              }

              return acc;
            },
            {
              alignment: [],
              traits: [],
            },
          );

          if (traits.length) {
            results.traits = traits;
          }

          if (alignment.length) {
            results.alignment = alignment;
          }

          // Source
          let source =
            item.querySelector('.traits + .column > .row p') ||
            item.querySelector('h1:has(.title) + div.row');

          if (isTwoColumn) {
            source = item.querySelector('.traits + .row > p');
          }
          if (source) {
            const sources = [];
            const nodes = [...source.childNodes];
            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              if (node.nodeName === 'A') {
                const page = nodes[i + 1];
                const s = {};
                s.name = node.textContent;
                s.id = _parseIdFromHref(node.href);
                s.prd = node.href;
                s.page = Number(page.textContent.replace(/\D*/g, ''));

                if (i + 2 < nodes.length && nodes[i + 2].nodeName === 'SUP') {
                  s.version = nodes[i + 2].textContent;
                  i += 2;
                } else {
                  i++;
                }
                sources.push(s);
              }
            }

            results.source = sources;
          }

          // Meta
          // Only look for meta in the current column
          const metaParent = isTwoColumn || item;
          const meta = await Promise.all(
            [...metaParent.querySelectorAll('.traits + .column > p')].map(
              async (m) => {
                const key = m.querySelector('strong').textContent;
                let value = m.textContent.replace(key, '').trim();
                // Allow for archetypes
                // Handle parenthesis (sheild warden)
                // Let requirements have a link (Swift banishment)
                if (key === 'Prerequisites') {
                  const prereqs = value.split(';').map((p) => p.trim());
                  const links = [...m.querySelectorAll('a')];
                  if (links.length) {
                    // Allow for links in plain text
                    value = await Promise.all(
                      prereqs.map(async (p) => {
                        const link = links.find((l) => l.textContent === p);
                        if (link) {
                          return await _ref(link);
                        }
                        return p;
                      }),
                    );
                  }
                }
                return { key, value };
              },
            ),
          );

          if (meta.length) {
            results.meta = meta;
          }

          // Description
          const nodes = isTwoColumn
            ? [...item.querySelector('h1 + .row > .column').childNodes]
            : [...item.childNodes];
          const starter = isTwoColumn
            ? item.querySelector('.traits + .row')
            : item.querySelector('hr');

          const start =
            (nodes.findIndex((n) => n.isEqualNode(starter)) || 0) + 1;
          const content = nodes.slice(start);
          results.description = content.map(_parseChildNode).join('');

          // Sidebar
          const sidebar = item.querySelector('aside.option-container');
          if (sidebar) {
            results.sidebar = [...sidebar.childNodes]
              .map(_parseChildNode)
              .join('');
          }

          // Images
          const images = [
            ...item.querySelectorAll(':not(h1) .row .column img'),
          ].map((img) => {
            return {
              src: img.src,
              alt: img.alt,
            };
          });
          if (images.length) {
            results.images = images;
          }

          // Diety-specific stuff
          // Need favored weapon
          // Need domains
          // Need spells
          // Need font
          // Need skill
          // Need divine ability

          // Spell-specific stuff
          // Cast may have trigger (Air Bubble)
          // Cast may have requirements (Alarm)
          // Cast may have components (Augury)
          // Range may have area (Alarm)
          // Range may have target (Anathematic Reprisal)
          // May have dieties (Animal Form)
          // Range may only have area (Antimagic Field)
          // Need to handle traditions/spell lists/bloodlines

          // Weapon-specific stuff
          // price/damage/bulk/critical specialization

          // Ancestry-specific stuff

          // Skill-specific stuff
          // Feats

          // Class-specific stuff
          if (results.type === 'classes') {
            const boosts = [...item.querySelectorAll('p > strong')];
            const headers = item.querySelectorAll('h3 .title p');
            // Ability
            results.ability = boosts
              .find((s) => s.textContent.includes('Key Ability:'))
              .textContent.split(':')[1]
              .split(' or ')
              .map((a) => a.toLowerCase().trim().slice(0, 3));

            // Hit Points
            results.hp = Number(
              boosts
                .find((s) => s.textContent.includes('Hit Points:'))
                .textContent.split(':')[1]
                .trim()
                .replace(/\D*/g, ''),
            );

            // Proficiencies
            results.proficiencies = {};

            // Perception
            const perception = _findElementByText(headers, 'Perception', 'h3');
            if (perception) {
              results.proficiencies.perception = (
                await _parseTraining(perception.nextSibling)
              )[0].level;
            }
            // Class
            const classDC = _findElementByText(headers, 'Class DC', 'h3');
            if (classDC) {
              results.proficiencies.class = (
                await _parseTraining(classDC.nextSibling)
              )[0].level;
            }
            // Skills
            const skills = _findElementByText(headers, 'Skills', 'h3');
            if (skills) {
              const skillList = await _parseTraining(skills.nextSibling);

              // Remove "one or more skills" as they'll be added by the subclass
              const oneOrMoreSkills = skillList.findIndex(
                (s) =>
                  s.name.includes('one or more skills determined') ||
                  s.name.includes('one skill determined'),
              );
              if (oneOrMoreSkills > -1) {
                skillList.splice(oneOrMoreSkills, 1);
              }

              // Transform additional skills into a number
              const additionalSkills = skillList.findIndex(
                (s) =>
                  s.name.includes('a number of additional') ||
                  s.name.includes('a number of skills'),
              );
              results.skills = Number(
                skillList[additionalSkills].name.replace(/\D*/g, ''),
              );
              skillList.splice(additionalSkills, 1);

              results.proficiencies.skills = skillList.reduce((acc, cur) => {
                if (cur.slug.includes('lore')) {
                  const lore = cur.slug.split('-')[1];

                  Array.isArray(acc.lore)
                    ? acc.lore.push({
                        lore,
                        level: cur.level,
                      })
                    : (acc.lore = [
                        {
                          lore,
                          level: cur.level,
                        },
                      ]);
                } else {
                  acc[cur.slug] = cur.level;
                }
                return acc;
              }, {});
            }
            // Saving Throws
            const savingThrows = _findElementByText(
              headers,
              'Saving Throws',
              'h3',
            );
            if (savingThrows) {
              results.proficiencies.saves = (
                await _parseTraining(savingThrows.nextSibling)
              ).reduce((acc, s) => {
                acc[s.name.toLowerCase()] = s.level;
                return acc;
              }, {});
            }
            // Attacks
            const attacks = _findElementByText(headers, 'Attacks', 'h3');
            if (attacks) {
              const training = await _parseTraining(attacks.nextSibling);
              const weapons = {
                unarmed:
                  training.find((a) => a.name === 'unarmed attacks')?.level ||
                  'U',
                simple:
                  training.find((a) => a.name === 'simple weapons')?.level ||
                  'U',
                martial:
                  training.find((a) => a.name === 'martial weapons')?.level ||
                  'U',
                advanced:
                  training.find((a) => a.name === 'advanced weapons')?.level ||
                  'U',
                other: training
                  .filter(
                    (a) =>
                      [
                        'unarmed attacks',
                        'simple weapons',
                        'martial weapons',
                        'advanced weapons',
                      ].indexOf(a.name) === -1,
                  )
                  .map((a) => ({
                    level: a.level,
                    id: a.url,
                  })),
              };
              results.proficiencies.attacks = weapons;
            }
            // Defenses
            const defenses = _findElementByText(headers, 'Defenses', 'h3');
            if (defenses) {
              results.proficiencies.defenses = (
                await _parseTraining(defenses.nextSibling)
              )
                .map((d) => {
                  d.name = d.name
                    .toLowerCase()
                    .replace(' armor', '')
                    .replace(' defense', '')
                    .trim();
                  if (d.name.includes('all')) {
                    return ['light', 'medium', 'heavy'].map((a) => ({
                      level: d.level,
                      name: a,
                    }));
                  }
                  return d;
                })
                .flat()
                .reduce((acc, d) => {
                  acc[d.name] = d.level;
                  return acc;
                }, {});
            }

            // Spells
            // [tradition] attack/save
          }

          return results;
        }),
      );
    })
  )
    .map((item) => {
      let tweaked = {};

      if (manual.post) {
        const { id, slug } = item;
        tweaked = manual.post[id] || manual.post[slug];
      }

      if (tweaked?.traits) {
        tweaked.traits = tweaked.traits.map((t) => {
          const url = new URL(t.href);
          const id = Number(url.searchParams.get('ID'));
          const type = slug(url.pathname.replace('.aspx', '').slice(1));

          return `/${type}/${id}`;
        });
      }

      const final = Object.assign(item, tweaked);
      final.description = sanitizeMarkdown(final.description);
      if (final.sidebar) {
        final.sidebar = sanitizeMarkdown(final.sidebar);
      }

      logIncrement();
      return item;
    })
    .filter((item, i, arr) => i === arr.findIndex((t) => t.id === item.id));

  const filename = items[0].type;

  return cleanup(
    {
      filename,
      data: items,
    },
    browser,
    page,
  );
}
