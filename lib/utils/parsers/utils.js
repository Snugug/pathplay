/**
 * Parses the given link into a reference object
 * @param {HTMLAnchorElement} link - The link to parse
 * @return {Promise<{name: string, slug: string, id: number, type: string, url: string, prd: string}>}
 */
async function _ref(link) {
  const name = link.textContent;
  const id = _parseIdFromHref(link.href);
  const type = _parseTypeFromHref(link.href);
  const path = _parseURLFromHref(link.href);
  const slug = await _slugify(name);

  return {
    name,
    slug,
    id,
    type,
    url: path,
    prd: link.href,
  };
}

/**
 *
 * @param {string} href
 * @return {string}
 */
function _parseURLFromHref(href) {
  const id = _parseIdFromHref(href);
  const type = _parseTypeFromHref(href);
  if (id) {
    return `/${type}/${id}`;
  }
  return `/${type}`;
}

/**
 *
 * @param {string} href
 * @return {number}
 */
function _parseIdFromHref(href) {
  const url = new URL(href);
  const id = url.searchParams.get('ID');
  if (id) {
    return Number(id);
  }

  return false;
}

/**
 *
 * @param {string} href
 * @return {string}
 */
function _parseTypeFromHref(href) {
  const url = new URL(href);
  const path = url.pathname.replace('.aspx', '').slice(1);

  try {
    return path
      .match(/[A-Z][a-z]+/g)
      .map((i) => i.toLowerCase())
      .join('-');
  } catch (e) {
    return path;
  }
}

/**
 * Determines if the given node is a text node, and if not, return the mapping of the node's children
 * @param {HTMLElement} node
 * @return {string}
 */
function _childContent(node) {
  if (node.childNodes) {
    return [...node.childNodes].map(_parseChildNode).join('');
  }

  return node.textContent;
}

/**
 *
 * @param {HTMLElement} node
 * @param {string} content
 * @return {string}
 */
function _parseChildNode(node) {
  switch (node.nodeName) {
    case '#text':
      return node.textContent;
    case 'P':
      return `${_childContent(node)}\n`;
    case 'BR':
      return '\n';

    case 'A': {
      return `[${node.textContent}](${_parseURLFromHref(node.href)})`;
    }
    case 'I':
    case 'EM':
      return `_${_childContent(node)}_`;

    case 'B':
    case 'STRONG':
      return `**${_childContent(node)}**`;

    case 'UL':
      return [...node.childNodes]
        .map((item) => `\n- ${_childContent(item)}`)
        .join('');

    case 'OL':
      return [...node.childNodes]
        .map((item) => `\n1. ${_childContent(item)}`)
        .join('');
    case 'H2':
      return `\n\n## ${node.textContent}\n\n`;
    case 'H3':
      return `\n\n### ${node.textContent}\n\n`;
    case 'H4':
      return `\n\n#### ${node.textContent}\n\n`;
    case 'H5':
      return `\n\n##### ${node.textContent}\n\n`;
    case 'H6':
      return `\n\n###### ${node.textContent}\n\n`;
    default:
      if (node.querySelector('table')) {
        let table = '';
        const t = node.querySelector('table');
        const rows = [...t.querySelectorAll('tr')];
        const headers = [...rows[0].querySelectorAll('td')].map(
          (h) => ` ${h.textContent} `,
        );
        table += `\n\n|${headers.join(' | ')}|\n|${headers
          .map(() => ' --- ')
          .join(' | ')}| \n`;

        const body = rows
          .slice(1)
          .map(
            (r) =>
              `|${[...r.querySelectorAll('td')]
                .map((c) => ` ${_childContent(c)} `)
                .join(' | ')}|\n`,
          )
          .join('');
        table += body + '\n\n';
        return table;
      }

      if (node.classList && node.nodeName === 'DIV') {
        return [...node.childNodes].map(_parseChildNode).join('');
      }
      break;
  }

  return '';
}

/**
 *
 * @param {NodeList} elements - The selector to use to find the element
 * @param {string} text - The text to search for
 * @param {string} parent - The parent element to return
 * @return {HTMLElement}
 */
function _findElementByText(elements, text, parent) {
  const found = [...elements].find((el) => el.textContent === text);
  if (found) {
    return found.closest(parent) || false;
  }
  return false;
}

/**
 * @param {HTMLElement} parent
 * @return {Array<{level: string, name: string, id: number, type: string, path: string}>}
 */
async function _parseTraining(parent) {
  const all = [...parent.childNodes].filter((n) => n.nodeName !== 'BR');
  const training = [];

  for (let i = 0; i < all.length; i++) {
    const node = all[i];
    // X and Y
    // List of links
    // Something that's not either of those
    const text = node.textContent.trim();
    if (
      node.nodeName === '#text' &&
      (text.startsWith('Trained') || text.startsWith('Expert'))
    ) {
      const [level, name] = text.split(' in ');
      const l = level.charAt(0).toUpperCase();

      if (name && name.indexOf('.') > -1) {
        break;
      }

      if (!name || (i + 1 < all.length && all[i + 1].nodeName === 'A')) {
        let j = i + 1;
        do {
          const next = all[j];
          if (next.nodeName === 'A') {
            const ref = await _ref(next);
            training.push({
              level: l,
              ...ref,
            });
          }
          j++;
        } while (j + 1 < all.length);
      } else {
        if (name.indexOf(' and ') > -1) {
          const categories = ['simple', 'martial', 'advanced'].filter(
            (c) => name.indexOf(c) > -1,
          );
          let group = name;
          for (const c of categories) {
            group = group.replace(c, '');
          }
          group = group
            .split(' and ')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          for (const item of group) {
            for (const c of categories) {
              training.push({
                level: l,
                name: `${c} ${item}`,
              });
            }
          }
        } else {
          training.push({
            level: l,
            name,
          });
        }
      }
    }
  }

  return training;
}
