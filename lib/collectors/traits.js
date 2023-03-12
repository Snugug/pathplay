import { sanitizeMarkdown } from '../utils/text.js';

import { setup, cleanup } from '../utils/puppeteer.js';
import { parentPort } from 'worker_threads';
import { manualTraits } from './manual/traits.js';

const { browser, page } = await setup();

await page.goto('https://2e.aonprd.com/Traits.aspx');
await page.waitForSelector('.trait');
const traits = await page.$$eval('.trait', (traits) => {
  return traits.map((trait) => {
    const name = trait.title;
    const url = trait.querySelector('a').href;
    return { name, url };
  });
});

parentPort.postMessage({ start: traits.length });

const t = [];

for (const trait of traits) {
  await page.goto(trait.url);
  const container = '#ctl00_RadDrawer1_Content_MainContent_DetailedOutput';
  await page.waitForSelector(container);

  const content = await page
    .$eval(container, (parent) => {
      const source = parent.querySelector('h1.title + b + a');
      const feats = parent.querySelector('h2.title');
      const starter = parent.querySelector('h1.title + b + a ~ br');

      const nodes = [...parent.childNodes];
      const start = nodes.findIndex((n) => n?.isEqualNode(starter));
      let content = '';
      let counter = nodes[start + 1];
      do {
        if (counter.nodeType === Node.TEXT_NODE) {
          content += counter.textContent;
        } else {
          switch (counter.nodeName) {
            case 'BR':
              content += '\n';
              break;
            case 'A': {
              const url = new URL(counter.href);
              const id = Number(url.searchParams.get('ID'));
              const path = url.pathname.toLowerCase().replace('.aspx', '');
              content += `[${counter.textContent}](${path}/${id})`;
              break;
            }
            case 'I':
              content += `_${counter.textContent}_`;
              break;
            case 'B':
              content += `**${counter.textContent}**`;
              break;
            default:
              content += counter.outerHTML;
              break;
          }
        }
        counter = counter.nextSibling;
      } while (feats && !counter?.isEqualNode(feats));

      return {
        source: {
          name: source.textContent,
          url: source.href,
        },
        description: content,
      };
    })
    .catch((e) => console.error(e));

  const url = new URL(trait.url);
  const id = Number(url.searchParams.get('ID'));
  trait.url = `/traits/${id}`;
  const final = Object.assign(
    { ...trait, ...content, id },
    manualTraits[id] || {},
  );
  final.description = sanitizeMarkdown(final.description);
  t.push(final);
  parentPort.postMessage('increment');
}

await cleanup(
  {
    filename: 'traits.json',
    data: t,
  },
  browser,
  page,
);
