import puppeteer from 'puppeteer';
import process from 'process';
import { parentPort } from 'worker_threads';
import { outputFile } from 'fs-extra/esm';
import { join } from 'path';
import { createRequire } from 'module';
import { sanitizeMarkdown } from './text.js';
import { logStart, logIncrement } from './log.js';

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

      return '*{{function-' + (functions.length - 1) + '}}*';
    }

    return val;
  }

  /**
   * Replaces the string with the function
   * @param {string[]} match - the match from the regex
   * @param {number} id - the id of the function
   * @return {string} - the function as a string
   */
  function putFunction(match, id) {
    return functions[id];
  }

  await outputFile(
    join('public', 'data', filename),
    `const output = ${JSON.stringify(data, pullFunction, 2).replace(
      /"\*\{\{function-(\d+)\}\}\*"/g,
      putFunction,
    )};\nexport default output;`,
  );
  await page.close();
  await browser.close();
}

/**
 *
 * @param {Page} page - Puppeteer page object
 * @return {object};
 */
// export async function parseDetailedOutput(page) {
//   const container = '#ctl00_RadDrawer1_Content_MainContent_DetailedOutput';
//   await page.waitForSelector(container);

//   return await page
//     .$eval(container, async (parent) => {
//       /**
//        *
//        * @param {HTMLElement} node
//        * @param {string} content
//        * @return {string}
//        */
//       function _parseChildNode(node) {
//         switch (node.nodeName) {
//           case '#text':
//             return node.textContent;

//           case 'BR':
//             return '\n';

//           case 'A': {
//             const url = new URL(node.href);
//             const id = Number(url.searchParams.get('ID'));
//             const path = url.pathname.toLowerCase().replace('.aspx', '');
//             return `[${node.textContent}](${path}/${id})`;
//           }
//           case 'I':
//             return `_${node.textContent}_`;

//           case 'B':
//             return `**${node.textContent}**`;

//           case 'UL': {
//             let content = '';
//             for (const item of node.childNodes) {
//               if (item.nodeName === 'LI') {
//                 content += `\n- ${item.textContent}`;
//                 // This was exploding; trying w/o for now
//                 // let c = '\n- ';
//                 // let n;
//                 // do {
//                 //   c += _parseChildNode(item);
//                 //   n = item?.nextSibling;
//                 // } while (n);
//                 // return c;
//               }
//             }
//             return content;
//           }
//           case 'H2':
//             return `\n\n## ${node.textContent}\n\n`;
//           case 'H3':
//             return `\n\n### ${node.textContent}\n\n`;
//           case 'H4':
//             return `\n\n#### ${node.textContent}\n\n`;
//           case 'H5':
//             return `\n\n##### ${node.textContent}\n\n`;
//           case 'H6':
//             return `\n\n###### ${node.textContent}\n\n`;
//           default:
//             if (node?.classList?.length === 0 && node.nodeName === 'DIV') {
//               return node.outerHTML;
//             }
//             break;
//         }

//         return '';
//       }

//       const source = parent.querySelector('h1.title + b + a');

//       // Main Description
//       const feats = parent.querySelector('h2.title');
//       const starter = parent.querySelector('h1.title + b + a ~ br');
//       const nodes = [...parent.childNodes];
//       const start = nodes.findIndex((n) => n?.isEqualNode(starter)) + 1;
//       const end = feats
//         ? nodes.findIndex((n) => n?.isEqualNode(feats))
//         : nodes.length;
//       const content = nodes.slice(start, end).map(_parseChildNode).join('');
//       console.log(content);

//       // Sidebar
//       const aside = parent.querySelector('.sidebar-nofloat');
//       let sidebar = null;

//       if (aside) {
//         sidebar = {
//           name: aside.querySelector('h2').textContent,
//           content: [...aside.childNodes].slice(1).map(_parseChildNode).join(''),
//         };
//       }

//       // Results
//       const results = {
//         source: {
//           name: source.textContent,
//           url: source.href,
//         },
//         description: content,
//       };

//       if (sidebar) {
//         results.sidebar = sidebar;
//       }

//       return results;
//     })
//     .catch((e) => console.error(e));
// }

/**
 *
 * @param {string} url URL to search from
 * @param {string} filename Filename to save to
 * @param {object} manual Manual items to add to
 */
export async function parseFromSearch(url, filename, manual = {}) {
  // Setup
  const { browser, page } = await setup();

  // Go to URL, add browser additions
  await page.goto(url);
  await page.addScriptTag({
    path: require.resolve('./browser.js'),
  });

  // Wait for the search to load
  let loadAll = false;
  do {
    try {
      loadAll = await (
        await page.evaluateHandle(
          `document.querySelector("#main > nethys-search").shadowRoot.querySelector("div > div > div.column.gap-large.align-center > div.row.gap-medium > button:last-of-type")`,
        )
      ).asElement();
    } catch (e) {
      loadAll = false;
    }
  } while (!loadAll);

  // Get total
  const total = await (
    await page.evaluateHandle(
      `document.querySelector("#main > nethys-search").shadowRoot.querySelector("div > div > div.column.gap-large.align-center > div.limit-width.fill-width-with-padding.fade-in")`,
    )
  ).asElement();
  let [current, max] = (
    await (await total.getProperty('textContent')).jsonValue()
  )
    .split(' of ')
    .map((x) => Number(x.replace(/\D*/g, '')));

  // Load all if not currently loaded
  if (current !== max) {
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
    await page.evaluate(() => {
      /* global _parseIdFromHref, _parseTypeFromHref, _parseChildNode */
      const items = [
        ...document
          .querySelector('#main > nethys-search')
          .shadowRoot.querySelectorAll('section.column'),
      ];

      return items.map((item) => {
        const results = {};
        const title = item.querySelector('h1 .title p a');
        const id = _parseIdFromHref(title.href);
        const type = _parseTypeFromHref(title.href);
        const level = item
          .querySelector('h1 .title .align-right')
          ?.textContent?.split(' ')[1];

        results.title = title.textContent;
        results.id = id;
        results.type = type;
        results.url = `/${type}/${id}`;
        results.prd = title.href;
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
        const { alignment, traits } = [
          ...item.querySelectorAll('.traits a'),
        ].reduce(
          (acc, cur) => {
            const alignment =
              cur.parentElement.classList.contains('trait-alignment');

            if (alignment) {
              acc.alignment.push({
                alignment: cur.textContent,
                id: _parseIdFromHref(cur.href),
                prd: cur.href,
              });
            } else {
              acc.traits.push({
                name: cur.textContent,
                id: _parseIdFromHref(cur.href),
              });
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
        const source =
          item.querySelector('.traits + .column > .row p') ||
          item.querySelector('h1:has(.title) + div.row');
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
        const meta = [...item.querySelectorAll('.traits + .column > p')].map(
          (m) => {
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
                value = prereqs.map((p) => {
                  const link = links.find((l) => l.textContent === p);
                  if (link) {
                    const id = _parseIdFromHref(link.href);
                    const type = _parseTypeFromHref(link.href);
                    return {
                      name: p,
                      id,
                      type,
                      url: `/${type}/${id}`,
                    };
                  }
                  return p;
                });
              }
            }
            return { key, value };
          },
        );

        if (meta.length) {
          results.meta = meta;
        }

        // Description
        const nodes = [...item.childNodes];
        const starter = item.querySelector('hr');
        const start = (nodes.findIndex((n) => n.isEqualNode(starter)) || 0) + 1;
        const content = nodes.slice(start);
        results.description = content.map(_parseChildNode).join('');

        // Sidebar
        const sidebar = item.querySelector('aside.option-container');
        if (sidebar) {
          results.sidebar = [...sidebar.childNodes]
            .map(_parseChildNode)
            .join('');
        }

        return results;
      });
    })
  ).map((item) => {
    const final = Object.assign(item, manual[item.id] || {});
    final.description = sanitizeMarkdown(final.description);
    if (final.sidebar) {
      final.sidebar = sanitizeMarkdown(final.sidebar);
    }

    logIncrement();
    return item;
  });

  return cleanup(
    {
      filename,
      data: items,
    },
    browser,
    page,
  );
}
