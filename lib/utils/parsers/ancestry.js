/**
 *
 * @param {HTMLElement} item - Parent element
 * @return {Object}
 */
async function _parseAncestry(item) {
  const results = {};
  const nodes = [...item.childNodes];

  const mechanics = [...item.querySelectorAll('h2 .title p')]
    .filter((p) => p.innerText.toLowerCase().includes('mechanics'))[0]
    .closest('h2');
  const start = (nodes.findIndex((n) => n.isEqualNode(mechanics)) || 0) + 1;

  for (let i = start; i < nodes.length; i++) {
    const node = nodes[i];
    // Basic headers
    // Actions

    if (node.tagName === 'H3') {
      const text = node.innerText.toLowerCase();
      switch (text) {
        case 'hit points':
          results.hp = Number(node.nextElementSibling.innerText);
          break;
        case 'size':
          results.size = node.nextElementSibling.innerText.toLowerCase();
          break;
        case 'speed':
          results.speed = Number(
            node.nextElementSibling.innerText.replace(/\D/g, ''),
          );
          break;
        case 'ability boosts': {
          const boosts = node.nextElementSibling.innerText
            .toLowerCase()
            .split(', ')
            .map((b) => b.trim().slice(0, 3));
          results.boosts = boosts;
          break;
        }
        case 'ability flaws': {
          const flaws = node.nextElementSibling.innerText
            .toLowerCase()
            .split(', ')
            .map((b) => b.trim().slice(0, 3));
          results.flaws = flaws;
          break;
        }
        case 'languages': {
          const languages = [...node.nextElementSibling.querySelectorAll('p')];
          const additional = languages.pop();
          const plus = Number(additional.innerText.replace(/\D/g, '')) || 0;
          const optional = [...additional.querySelectorAll('a')].map((l) =>
            _parseURLFromHref(l.href),
          );

          results.languages = {
            known: languages.map((l) =>
              _parseURLFromHref(l.querySelector('a').href),
            ),
            optional,
            additional: plus,
          };
          break;
        }
        case 'darkvision':
          Array.isArray(results.senses)
            ? results.senses.push({
                precision: 'precise',
                type: 'darkvision',
              })
            : (results.senses = [
                {
                  precision: 'precise',
                  type: 'darkvision',
                },
              ]);
          break;
        case 'low-light vision':
          Array.isArray(results.senses)
            ? results.senses.push({
                precision: 'precise',
                type: 'low-light vision',
              })
            : (results.senses = [
                {
                  precision: 'precise',
                  type: 'low-light vision',
                },
              ]);
          break;
        default: {
          // Parse H3s with following descriptions
          let desc = [];
          let isAction = false;
          const title = node.innerText;
          let counter = node.nextElementSibling;
          // Need to support tables
          // Kobold
          do {
            if (
              counter?.tagName === 'H2' &&
              counter.innerText.toLowerCase().includes('action')
            ) {
              isAction = true;
            } else {
              desc.push(counter);
              counter = counter?.nextElementSibling;
            }
          } while (isAction === false && counter && counter?.tagName !== 'H3');

          desc = desc.map((n) => _parseChildNode(n)).join('');

          if (desc.length) {
            const feature = {
              title,
              text: desc,
            };
            Array.isArray(results.features)
              ? results.features.push(feature)
              : (results.features = [feature]);
          }
        }
      }
    }
  }

  return results;
}
