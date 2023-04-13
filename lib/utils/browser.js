/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

/**
 *
 * @param {string} href
 * @return {number}
 */
function _parseIdFromHref(href) {
  const url = new URL(href);
  return Number(url.searchParams.get('ID'));
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
      const id = _parseIdFromHref(node.href);
      const path = _parseTypeFromHref(node.href);
      return `[${node.textContent}](/${path}/${id})`;
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
      if (node?.classList?.length === 0 && node.nodeName === 'DIV') {
        return node.outerHTML;
      }
      // if (
      //   node?.classList?.contains('option-container') &&
      //   node.nodeName === 'ASIDE'
      // ) {
      //   return '\n!!! aside\n' + _childContent(node) + '\n!!!\n';
      // }
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
      break;
  }

  return '';
}
