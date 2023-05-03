/**
 *
 * @param {Object} item
 */
export async function advancedPostprocess(item) {
  const { process } = await import(`./structured/${item.type}.js`);
  await process(item);
}

/**
 *
 * @param {string} item
 * @param {PuppeteerPage} page
 */
export async function genericPostprocess(item) {
  const { processed } = await import(`./structured/${item.type}.js`);
  const meta = processed.find((b) => b.url === item.url);

  for (const [key, value] of Object.entries(meta)) {
    item[key] = value;
  }
}
