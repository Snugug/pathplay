/**
 *
 * @param {string} item
 * @param {PuppeteerPage} page
 */
export async function genericPostprocess(item) {
  const { processed } = await import(`./structured/${item.type}-new.js`);
  const meta = processed.find((b) => b.url === item.url);

  for (const [key, value] of Object.entries(meta)) {
    item[key] = value;
  }
}
