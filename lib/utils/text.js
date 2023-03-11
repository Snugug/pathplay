import { marked } from 'marked';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 *
 * @param {string} dirty Dirty HTML
 * @return {string} Sanitized HTML
 */
export function sanitize(dirty) {
  return DOMPurify.sanitize(dirty);
}

/**
 *
 * @param {string} markdown Input markdown
 * @return {string} Sanitized HTML
 */
export function sanitizeMarkdown(markdown) {
  return sanitize(marked.parse(markdown));
}
