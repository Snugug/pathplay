/**
 *
 * @param {HTMLElement} item - Parent element
 * @param {Object} results - Results object
 * @return {Object}
 */
async function _parseSkill(item, results) {
  delete results.traits;
  delete results.rarity;
  const body = [...item.childNodes];
  const descStart = body.findIndex((n) =>
    n.isEqualNode(item.querySelector('h1.column + .row + p')),
  );
  const descEnd = body.findIndex((n) =>
    n.isEqualNode(
      [...item.querySelectorAll('h2.column')].find((n) =>
        n.innerText.toLowerCase().includes('item bonuses'),
      ),
    ),
  );

  if (descStart === -1 || descEnd === -1) {
    results.individual = false;
    return results;
  }

  results.individual = true;

  let desc = '';
  for (let i = descStart; i < descEnd; i++) {
    const n = body[i];
    if (n.innerText.toLowerCase().includes('general actions')) {
      do {
        i++;
      } while (i < descEnd || /^H\d$/.test(body[i].nodeName));
      i--;
    } else {
      desc += _parseChildNode(n);
    }
  }

  results.description = desc;
  return results;
}
