import { sanitizeMarkdown } from '../utils/text.js';
import { setup, cleanup, parseDetailedOutput } from '../utils/puppeteer.js';
import { logStart, logIncrement } from '../utils/log.js';
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

logStart(traits.length);

const t = [];

for (const trait of traits) {
  await page.goto(trait.url);

  const content = await parseDetailedOutput(page);

  const url = new URL(trait.url);
  const id = Number(url.searchParams.get('ID'));
  trait.url = `/traits/${id}`;
  const final = Object.assign(
    { ...trait, ...content, id },
    manualTraits[id] || {},
  );
  final.description = sanitizeMarkdown(final.description);
  t.push(final);
  logIncrement();
}

await cleanup(
  {
    filename: 'traits.json',
    data: t,
  },
  browser,
  page,
);
