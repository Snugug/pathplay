import { sanitizeMarkdown } from '../utils/text.js';
import { setup, cleanup, parseDetailedOutput } from '../utils/puppeteer.js';
import { logStart, logIncrement } from '../utils/log.js';
// import { manualTraits } from './manual/traits.js';

const { browser, page } = await setup();

await page.goto('https://2e.aonprd.com/Conditions.aspx');
await page.waitForSelector('h2.title');
const conditions = await page.$$eval('h2.title a', (conditions) => {
  return conditions.map((condition) => {
    const name = condition.textContent;
    const url = condition.href;
    return { name, url };
  });
});

logStart(conditions.length);

const t = [];

for (const condition of conditions) {
  await page.goto(condition.url);

  const content = await parseDetailedOutput(page);

  const url = new URL(condition.url);
  const id = Number(url.searchParams.get('ID'));
  conditions.url = `/conditions/${id}`;
  const final = Object.assign(
    { ...condition, ...content, id },
    // manualTraits[id] || {},
  );
  final.description = sanitizeMarkdown(final.description);
  if (final.sidebar) {
    final.sidebar.content = sanitizeMarkdown(final.sidebar.content);
  }
  t.push(final);
  logIncrement();
}

await cleanup(
  {
    filename: 'conditions.json',
    data: t,
  },
  browser,
  page,
);
