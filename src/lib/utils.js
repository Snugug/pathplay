/**
 *
 * @param {number} level
 * @param {string} nth
 * @return {boolean}
 */
export function isNth(level, nth) {
  const nthRegex = /(\d+)n(\s?\+\s?(\d+))?/;
  const nthMatch = nthRegex.exec(nth);
  const a = nthMatch[1] ? parseInt(nthMatch[1], 10) : 0;
  const b = nthMatch[3] ? parseInt(nthMatch[3], 10) : 0;
  return (level - b) % a === 0;
}
/**
 * Advancement

ASIx4 at 5n + 5
Skill Feat 2n + 2
General Feat 4n + 3
Class Feat 2n + 2
Ancestry Feat 4n + 5

 */
