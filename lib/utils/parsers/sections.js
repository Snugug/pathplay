/**
 * Parses actions from a string
 * @param {string} actions - Action text
 * @return {string}
 */
function _parseActions(actions) {
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
  return actions;
}

/**
 * Parses traits from a list of links
 * @param {HTMLLinkElement[]} traits - Traits to parse
 * @return {Promise<{rarity: string, alignment: string[], traits: string[]}>}
 */
async function _parseTraits(traits) {
  return traits.reduce(
    async (acc, cur) => {
      acc = await acc;

      const alignment = cur.parentElement.classList.contains('trait-alignment');
      const rarity =
        cur.parentElement.classList.contains('trait-rare') ||
        cur.parentElement.classList.contains('trait-uncommon');

      const trait = await _ref(cur);

      if (rarity) {
        acc.rarity = trait.slug;
      } else if (alignment) {
        if (acc.alignment.indexOf((t) => t.id === trait.id) === -1) {
          acc.alignment.push(trait.url);
        }
      } else {
        if (acc.traits.indexOf((t) => t.id === trait.id) === -1) {
          acc.traits.push(trait.url);
        }
      }

      return acc;
    },
    {
      rarity: null,
      alignment: [],
      traits: [],
    },
  );
}

/**
 * Parses sources from a source element
 * @param {HTMLElement} source
 * @return {{name: string, id: string, prd: string, page: number, version: string}[]}
 */
function _parseSource(source) {
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

  return sources;
}

/**
 * Parse Meta
 * @param {HTMLElement[]} meta
 * @return {Promise<{key: string, value: string}[]>}
 */
async function _parseMeta(meta) {
  return Promise.all(
    meta.map(async (m) => {
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
          value = await Promise.all(
            prereqs.map(async (p) => {
              const link = links.find((l) => l.textContent === p);
              if (link) {
                return await _ref(link);
              }
              return p;
            }),
          );
        }
      }
      return { key, value };
    }),
  );
}

/**
 *
 * @param {HTMLElement[]} headers
 * @param {HTMLElement[]} body
 * @return {Object[]}
 */
function _parseFeatures(headers, body) {
  const features = [];

  for (let i = 0; i < headers.length; i++) {
    const feature = {
      description: '',
    };

    const f = headers[i];
    const start = body.findIndex((n) => n.isEqualNode(f));
    let end = body.findIndex((n) => n.isEqualNode(headers[i + 1]));
    if (end >= 0) {
      end;
    } else {
      end = body.length;
    }
    const title = f.innerText;
    const level = f.querySelector('.align-right');
    feature.title = title.replace(level?.innerText || '', '').trim();
    feature.level = Number(level?.innerText?.replace(/\D*/g, '')) || 0;

    for (let j = start + 1; j < end; j++) {
      const n = body[j];
      if (n?.querySelector('.align-right')?.innerText === 'Action') {
        feature.action = _parseURLFromHref(n.querySelector('a').href);
        break;
      } else {
        feature.description += _parseChildNode(n);
      }
    }

    features.push(feature);
  }

  return features;
}

/**
 *
 * @param {string} input - Input String
 * @return {{description: string, value: number, quantity: number, unit: string}}
 */
function _parsePrice(input) {
  const price = {
    description: input,
  };
  const priceRegex =
    /(\d+)\s(sp|gp|cp)(, (\d+)\s(sp|gp|cp))?(\s\((price )?for (\d+)(\s\w*)?)?/gi;
  const cost = priceRegex.exec(price.description);

  if (cost) {
    price.value = Number(cost[1]);

    if (cost[2] === 'sp') {
      price.value = price.value / 10;
    } else if (cost[2] === 'cp') {
      price.value = price.value / 100;
    }

    if (cost[4]) {
      if (cost[5] === 'sp') {
        price.value += Number(cost[4]) / 10;
      } else if (cost[5] === 'cp') {
        price.value += Number(cost[4]) / 100;
      } else {
        price.value += Number(cost[4]);
      }
    }

    if (cost[8]) {
      price.quantity = Number(cost[8]);

      if (cost[9]) {
        price.unit = cost[9].trim();
      }
    }
  } else {
    price.value = 0;
  }
  return price;
}

/**
 *
 * @param {string} s Speed penalty string
 * @return {number}
 */
function _parseSpeedPenalty(s) {
  let speedPenalty = 0;

  const speedRegex = /(-\d{1,2}) ft/gim;
  const speed = speedRegex.exec(s);
  if (speed) {
    speedPenalty = Number(speed[1]);
  }

  return speedPenalty;
}

/**
 *
 * @param {string} b bulk
 * @return {{description: string, value: number}}
 */
function _parseBulk(b) {
  const bulk = {
    description: b,
  };

  if (b.toLowerCase() === 'l') {
    bulk.value = 0.1;
  } else if (!isNaN(b)) {
    bulk.value = Number(b);
  } else {
    bulk.value = 0;
  }

  return bulk;
}
