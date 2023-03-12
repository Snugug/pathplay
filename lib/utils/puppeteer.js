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
      function _parseChildNode(node, content = '') {
        switch (node.nodeName) {
          case '#text':
            content += node.textContent;
            break;
          case 'BR':
            content += '\n';
            break;
          case 'A': {
            const url = new URL(node.href);
            const id = Number(url.searchParams.get('ID'));
            const path = url.pathname.toLowerCase().replace('.aspx', '');
            content += `[${node.textContent}](${path}/${id})`;
            break;
          }
          case 'I':
            content += `_${node.textContent}_`;
            break;
          case 'B':
            content += `**${node.textContent}**`;
            break;
          case 'UL': {
            for (const item of node.childNodes) {
              if (item.nodeName === 'LI') {
                let c = '\n- ';
                let n;
                do {
                  c += _parseChildNode(item);
                  n = item?.nextSibling;
                } while (n);
                content += c;
              }
            }
            break;
          }
          case 'H2':
            content += `\n\n## ${node.textContent}`;
            break;
          case 'H3':
            content += `\n\n### ${node.textContent}`;
            break;
          case 'H4':
            content += `\n\n#### ${node.textContent}`;
            break;
          case 'H5':
            content += `\n\n##### ${node.textContent}`;
            break;
          case 'H6':
            content += `\n\n###### ${node.textContent}`;
            break;
          default:
            if (node?.classList?.length === 0 && node.nodeName === 'DIV') {
              content += node.outerHTML;
            }
            break;
        }

        return content;
      }

      const source = parent.querySelector('h1.title + b + a');

      // Main Description
      const feats = parent.querySelector('h2.title');
      const starter = parent.querySelector('h1.title + b + a ~ br');
      const nodes = [...parent.childNodes];
      const start = nodes.findIndex((n) => n?.isEqualNode(starter));
      let content = '';
      let counter = nodes[start + 1];
      do {
        content += _parseChildNode(counter);
        counter = counter.nextSibling;
      } while (feats && !counter?.isEqualNode(feats));

      // Sidebar
      const aside = parent.querySelector('.sidebar-nofloat');
      let sidebar = null;

      if (aside) {
        sidebar = {
          name: aside.querySelector('h2').textContent,
          content: '',
        };
        const nodes = [...aside.childNodes];
        let counter = nodes[1];

        do {
          content += _parseChildNode(counter);
          counter = counter.nextSibling;
        } while (counter);
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
