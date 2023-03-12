import puppeteer from 'puppeteer';
import process from 'process';
import { parentPort } from 'worker_threads';
import { outputFile } from 'fs-extra/esm';
import { join } from 'path';

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
  await outputFile(
    join('public', 'data', filename),
    JSON.stringify(data, null, 2),
  );
  await page.close();
  await browser.close();
}

/**
 *
 * @param {Page} page - Puppeteer page object
 * @return {object};
 */
export async function parseDetailedOutput(page) {
  const container = '#ctl00_RadDrawer1_Content_MainContent_DetailedOutput';
  await page.waitForSelector(container);

  return await page
    .$eval(container, async (parent) => {
      /**
       *
       * @param {HTMLElement} node
       * @param {string} content
       * @return {string}
       */
      function _parseChildNode(node) {
        switch (node.nodeName) {
          case '#text':
            return node.textContent;

          case 'BR':
            return '\n';

          case 'A': {
            const url = new URL(node.href);
            const id = Number(url.searchParams.get('ID'));
            const path = url.pathname.toLowerCase().replace('.aspx', '');
            return `[${node.textContent}](${path}/${id})`;
          }
          case 'I':
            return `_${node.textContent}_`;

          case 'B':
            return `**${node.textContent}**`;

          case 'UL': {
            let content = '';
            for (const item of node.childNodes) {
              if (item.nodeName === 'LI') {
                content += `\n- ${item.textContent}`;
                // This was exploding; trying w/o for now
                // let c = '\n- ';
                // let n;
                // do {
                //   c += _parseChildNode(item);
                //   n = item?.nextSibling;
                // } while (n);
                // return c;
              }
            }
            return content;
          }
          case 'H2':
            return `\n\n## ${node.textContent}\n\n`;
          case 'H3':
            return `\n\n### ${node.textContent}\n\n`;
          case 'H4':
            return `\n\n#### ${node.textContent}\n\n`;
          case 'H5':
            return `\n\n##### ${node.textContent}\n\n`;
          case 'H6':
            return `\n\n###### ${node.textContent}\n\n`;
          default:
            if (node?.classList?.length === 0 && node.nodeName === 'DIV') {
              return node.outerHTML;
            }
            break;
        }

        return '';
      }

      const source = parent.querySelector('h1.title + b + a');

      // Main Description
      const feats = parent.querySelector('h2.title');
      const starter = parent.querySelector('h1.title + b + a ~ br');
      const nodes = [...parent.childNodes];
      const start = nodes.findIndex((n) => n?.isEqualNode(starter)) + 1;
      const end = feats
        ? nodes.findIndex((n) => n?.isEqualNode(feats))
        : nodes.length;
      const content = nodes.slice(start, end).map(_parseChildNode).join('');
      console.log(content);

      // Sidebar
      const aside = parent.querySelector('.sidebar-nofloat');
      let sidebar = null;

      if (aside) {
        sidebar = {
          name: aside.querySelector('h2').textContent,
          content: [...aside.childNodes].slice(1).map(_parseChildNode).join(''),
        };
      }

      // Results
      const results = {
        source: {
          name: source.textContent,
          url: source.href,
        },
        description: content,
      };

      if (sidebar) {
        results.sidebar = sidebar;
      }

      return results;
    })
    .catch((e) => console.error(e));
}
