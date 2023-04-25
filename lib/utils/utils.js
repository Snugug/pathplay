/**
 *
 * @param {PuppeteerPage} page
 * @return {Promise<{current: number, max: number}>}
 */
export async function waitForAllResults(page) {
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
  let loadAll;
  if (current !== max) {
    // Get load all button
    loadAll = await (
      await page.evaluateHandle(
        `document.querySelector("#main > nethys-search").shadowRoot.querySelector("div > div > div.column.gap-large.align-center > div.row.gap-medium > button:last-of-type")`,
      )
    ).asElement();
    if (!loadAll) {
      loadAll = await (
        await page.evaluateHandle(
          `document.querySelector("#main > nethys-search").shadowRoot.querySelector("div > div > div.column.gap-large.align-center > div:nth-child(2) > div > div > button:nth-child(2)")`,
        )
      ).asElement();
    }
    if (loadAll) {
      await loadAll.click();
      do {
        current = (await (await total.getProperty('textContent')).jsonValue())
          .split(' of ')
          .map((x) => Number(x.replace(/\D*/g, '')))[0];
      } while (current !== max);
    }
  }

  return { current, max };
}
