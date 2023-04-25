/**
 *
 * @param {HTMLElement} item - Parent element
 * @param {Object} results - Results object
 * @return {Object}
 */
async function _parseBackgrounds(item, results) {
  // Abilities
  const abilityCountRegex = /(gain|choose) (\w*) (free )?ability/im;

  const abilityNode = [...item.querySelectorAll('p')].find(
    (n) => n.innerText.match(abilityCountRegex)?.length,
  );

  results.abilities = {
    total: 0,
    options: [],
    free: false,
  };

  const count = abilityNode.innerText.match(abilityCountRegex);

  switch (count[2]) {
    case 'one':
      results.abilities.total = 1;
      break;
    case 'two':
      results.abilities.total = 2;
      break;
    case 'three':
      results.abilities.total = 3;
      break;
    default:
  }

  const text = abilityNode.innerText.replace(count[0], '').trim();
  const abilityRegex =
    /(strength|dexterity|constitution|intelligence|wisdom|charisma|free)/gim;
  const abilities = text.match(abilityRegex);

  if (abilities) {
    if (abilities.includes('free')) {
      results.abilities.free = true;
      abilities.splice(abilities.indexOf('free'), 1);
    }
    results.abilities.options = abilities.map((a) => a.toLowerCase());
  } else {
    results.abilities.free = true;
  }

  // Weapons
  // Ruby Phoenix Enthusiast
  // Languages
  // Thassilonian Delver
  // Demon Slayer

  // Skills
  results.skills = item.querySelector('a[href*="Skills.aspx"]') ? true : false;
  results.feats = item.querySelector('a[href*="Feats.aspx"]') ? true : false;

  // Actions
  const action = [...item.querySelectorAll('p')].find(
    (i) =>
      i.innerText.match(/\[((\w)*)?(\s|-)?action(s)?]/im) ||
      i.innerText.includes('Frequency once per day'),
  );

  if (action) {
    const a = {
      name: action.querySelector('strong').innerText,
    };
    if (action.querySelector('.icon-font')) {
      a.action = action.querySelector('.icon-font').innerText;
    }

    const body = [...action.childNodes];
    let desc = false;
    for (let i = 1; i < body.length; i++) {
      const n = body[i];
      if (n.textContent?.trim() === '(' && i < 4) {
        do {
          i++;
          const bn = body[i];
          if (bn.nodeName === 'A' && bn.href.includes('Traits.aspx')) {
            if (!Array.isArray(a.traits)) {
              a.traits = [];
            }
            a.traits.push(_parseURLFromHref(body[i].href));
          }
        } while (
          body[i + 1]?.textContent.trim() !== ');' &&
          body[i + 1]?.textContent.trim() !== ')'
        );
      }
      if (n.nodeName === 'STRONG') {
        if (n.innerText.trim() !== 'Effect') {
          const key = n.innerText.toLowerCase().trim();
          let value = '';
          do {
            i++;
            value += _parseChildNode(body[i]);
          } while (body[i + 1].nodeName !== 'STRONG');

          a[key] = value.trim().replace(/;$/, '');
          // a[n.innerText.toLowerCase()] = body[i + 1].innerText;
        } else {
          i++;
          desc = _parseChildNode(body[i]);
        }
      } else if (desc) {
        desc += _parseChildNode(n);
      }
    }

    let counter = action;

    while (counter.nextElementSibling) {
      desc +=
        '\n\n' +
        [...counter.nextElementSibling.childNodes]
          .map((c) => _parseChildNode(c))
          .join('');
      counter = counter?.nextElementSibling;
    }

    a.description = desc.trim();

    results.actions = [a];
  }

  // https://2e.aonprd.com/Search.aspx?include-types=background&display=table&columns=skill%2Cfeat

  return results;
}
