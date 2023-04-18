/* global _ref */

/**
 * Postprocess Ancestry
 * @param {Object} ancestry
 * @param {function} setupPage
 * @param {PuppeteerBrowser} browser
 */
export async function postprocessAncestry(ancestry, setupPage, browser) {
  const p = await setupPage(
    browser,
    `https://2e.aonprd.com/Heritages.aspx?Ancestry=${ancestry.id}`,
  );
  await p.waitForSelector('h1.title');
  const heritages = await p.evaluate(() => {
    /* global _parseURLFromHref */
    const h = [...document.querySelectorAll('h2.title a')]
      .filter((a) => a.href.includes('Heritage'))
      .map((a) => ({
        name: a.textContent,
        url: _parseURLFromHref(a.href),
      }));
    const a = [...document.querySelectorAll('b + u a')].map((a) => ({
      name: a.textContent,
      url: _parseURLFromHref(a.href),
    }));

    // Remove duplicates
    return [...a, ...h]
      .filter(
        (v, i, a) =>
          a.findIndex((t) => t.name.toLowerCase() === v.name.toLowerCase()) ===
          i,
      )
      .map((a) => a.url);
  });
  await p.close();
  ancestry.heritages = heritages;
}

/**
 * Postprocess Class
 * @param {Object} cls
 * @param {function} setupPage
 * @param {PuppeteerBrowser} browser
 */
export async function postprocessClass(cls, setupPage, browser) {
  let p = await setupPage(
    browser,
    `https://2e.aonprd.com/Classes.aspx?ID=${cls.id}`,
  );
  await p.waitForSelector(
    '#ctl00_RadDrawer1_Content_MainContent_SubNavigation',
  );
  const slink = await p.evaluate(() => {
    const subnav = [
      ...document.querySelectorAll(
        '#ctl00_RadDrawer1_Content_MainContent_SubNavigation a',
      ),
    ];
    const samples = subnav.findIndex((a) =>
      a.innerText.includes('Sample Builds'),
    );

    if (samples < subnav.length - 1) {
      return subnav[samples + 1].href;
    }

    return null;
  });

  if (slink) {
    p = await setupPage(browser, slink);
    await p.waitForSelector(
      '#ctl00_RadDrawer1_Content_MainContent_DetailedOutput',
    );
    const specializations = await p.evaluate(async () => {
      const specializations = [];
      let headers = 'h1';
      const parent = document.querySelector(
        '#ctl00_RadDrawer1_Content_MainContent_DetailedOutput',
      );
      let start = parent.querySelector('h1.title');
      if (!start) {
        headers = 'h2';
        start = parent.querySelector('h2.title');
      }

      const body = [...parent.childNodes];

      for (let i = 0; i < body.length; i++) {
        const node = body[i];
        if (node.tagName === headers.toUpperCase()) {
          const name = node.querySelector('a:last-of-type');
          if (name) {
            const specialization = await _ref(name);
            // Parse source
            // Parse text
            // Parse actions (https://2e.aonprd.com/Methodologies.aspx)
            // Parse features, with level (https://2e.aonprd.com/Styles.aspx) (https://2e.aonprd.com/Causes.aspx) (https://2e.aonprd.com/Instincts.aspx)
            // Action/Level (https://2e.aonprd.com/Ways.aspx)
            // Action before features (https://2e.aonprd.com/ResearchFields.aspx)
            // Traits (https://2e.aonprd.com/Patrons.aspx)
            specializations.push(specialization);
          }
        }
      }

      if (specializations.length === 0) {
        return null;
      }
      return specializations;
    });

    if (specializations) {
      cls.specializations = specializations;
    }
  }

  await p.close();
}
