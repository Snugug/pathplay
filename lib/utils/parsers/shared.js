/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
/* global  _parseChildNode,  _ref, _parseActions, _parseTraits, _parseSource, _parseMeta */

/**
 *
 * @param {HTMLElement} item - Parent element
 * @return {Promise<Object>} - Parsed information
 */
async function _parseSharedInformation(item) {
  const title = item.querySelector('h1 .title p a');
  const results = await _ref(title);
  results.rarity = 'common';

  console.log(results.name);

  const level = item
    .querySelector('h1 .title .align-right')
    ?.textContent?.split(' ')[1];

  const isTwoColumn = item.querySelector('h1 + .row > .column');

  if (level) {
    results.level = Number(level);
  }

  // Actions
  const actions = item.querySelector(
    '.title a ~ span span.icon-font',
  )?.textContent;
  if (actions) {
    results.actions = _parseActions(actions);
  }

  // Traits
  const { rarity, alignment, traits } = await _parseTraits([
    ...item.querySelectorAll('.traits a'),
  ]);

  if (rarity) {
    results.rarity = rarity;
  }

  if (traits.length) {
    results.traits = traits;
  }

  if (alignment.length) {
    results.alignment = alignment;
  }

  // Source
  let source =
    item.querySelector('.traits + .column > .row p') ||
    item.querySelector('h1:has(.title) + div.row');

  if (isTwoColumn) {
    source = item.querySelector('.traits + .row > p');
  }
  if (source) {
    results.source = _parseSource(source);
  }

  // Meta
  // Only look for meta in the current column
  const metaParent = isTwoColumn || item;
  const meta = await _parseMeta([
    ...metaParent.querySelectorAll('.traits + .column > p'),
  ]);

  if (meta.length) {
    results.meta = meta;
  }

  // Description
  const nodes = isTwoColumn
    ? [...item.querySelector('h1 + .row > .column').childNodes]
    : [...item.childNodes];
  const starter = isTwoColumn
    ? item.querySelector('.traits + .row')
    : item.querySelector('hr');

  const start = (nodes.findIndex((n) => n.isEqualNode(starter)) || 0) + 1;
  const content = nodes.slice(start);
  results.description = content.map(_parseChildNode).join('');

  // Sidebar
  const sidebar = item.querySelector('aside.option-container');
  if (sidebar) {
    results.sidebar = [...sidebar.childNodes].map(_parseChildNode).join('');
  }

  // Images
  const images = [...item.querySelectorAll(':not(h1) .row .column img')].map(
    (img) => {
      return {
        src: img.src,
        alt: img.alt,
      };
    },
  );
  if (images.length) {
    results.images = images;
  }

  return results;
}