/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
/* global _parseIdFromHref, _parseChildNode, _findElementByText, _parseTraining, _ref, _parseActions, _parseTraits */

/**
 *
 * @param {HTMLElement} item - The parent element to search
 * @return {Promise<Object>} - An object containing the parsed class data
 */
async function _parseClasses(item) {
  const results = {};
  const boosts = [...item.querySelectorAll('p > strong')];
  const headers = item.querySelectorAll('h3 .title p');
  // Ability
  results.ability = boosts
    .find((s) => s.textContent.includes('Key Ability:'))
    .textContent.split(':')[1]
    .split(' or ')
    .map((a) => a.toLowerCase().trim().slice(0, 3));

  // Hit Points
  results.hp = Number(
    boosts
      .find((s) => s.textContent.includes('Hit Points:'))
      .textContent.split(':')[1]
      .trim()
      .replace(/\D*/g, ''),
  );

  // Proficiencies
  results.proficiencies = {};

  // Perception
  const perception = _findElementByText(headers, 'Perception', 'h3');
  if (perception) {
    results.proficiencies.perception = (
      await _parseTraining(perception.nextSibling)
    )[0].level;
  }
  // Class
  const classDC = _findElementByText(headers, 'Class DC', 'h3');
  if (classDC) {
    results.proficiencies.class = (
      await _parseTraining(classDC.nextSibling)
    )[0].level;
  }
  // Skills
  const skills = _findElementByText(headers, 'Skills', 'h3');
  if (skills) {
    const skillList = await _parseTraining(skills.nextSibling);

    // Remove "one or more skills" as they'll be added by the subclass
    const oneOrMoreSkills = skillList.findIndex(
      (s) =>
        s.name.includes('one or more skills determined') ||
        s.name.includes('one skill determined'),
    );
    if (oneOrMoreSkills > -1) {
      skillList.splice(oneOrMoreSkills, 1);
    }

    // Transform additional skills into a number
    const additionalSkills = skillList.findIndex(
      (s) =>
        s.name.includes('a number of additional') ||
        s.name.includes('a number of skills'),
    );
    results.skills = Number(
      skillList[additionalSkills].name.replace(/\D*/g, ''),
    );
    skillList.splice(additionalSkills, 1);

    results.proficiencies.skills = skillList.reduce((acc, cur) => {
      if (cur.slug.includes('lore')) {
        const lore = cur.slug.split('-')[1];

        Array.isArray(acc.lore)
          ? acc.lore.push({
              lore,
              level: cur.level,
            })
          : (acc.lore = [
              {
                lore,
                level: cur.level,
              },
            ]);
      } else {
        acc[cur.slug] = cur.level;
      }
      return acc;
    }, {});
  }
  // Saving Throws
  const savingThrows = _findElementByText(headers, 'Saving Throws', 'h3');
  if (savingThrows) {
    results.proficiencies.saves = (
      await _parseTraining(savingThrows.nextSibling)
    ).reduce((acc, s) => {
      acc[s.name.toLowerCase()] = s.level;
      return acc;
    }, {});
  }
  // Attacks
  const attacks = _findElementByText(headers, 'Attacks', 'h3');
  if (attacks) {
    const training = await _parseTraining(attacks.nextSibling);
    const weapons = {
      unarmed: training.find((a) => a.name === 'unarmed attacks')?.level || 'U',
      simple: training.find((a) => a.name === 'simple weapons')?.level || 'U',
      martial: training.find((a) => a.name === 'martial weapons')?.level || 'U',
      advanced:
        training.find((a) => a.name === 'advanced weapons')?.level || 'U',
      other: training
        .filter(
          (a) =>
            [
              'unarmed attacks',
              'simple weapons',
              'martial weapons',
              'advanced weapons',
            ].indexOf(a.name) === -1,
        )
        .map((a) => {
          if (a.url) {
            return {
              level: a.level,
              url: a.url,
            };
          }
          // Group may need to be updated
          const [category, group] = a.name.split(' ');
          if (['simple', 'martial', 'advanced'].includes(category)) {
            return {
              level: a.level,
              category,
              group,
            };
          }

          return a;
        }),
    };
    results.proficiencies.attacks = weapons;
  }
  // Defenses
  const defenses = _findElementByText(headers, 'Defenses', 'h3');
  if (defenses) {
    results.proficiencies.defenses = (
      await _parseTraining(defenses.nextSibling)
    )
      .map((d) => {
        d.name = d.name
          .toLowerCase()
          .replace(' armor', '')
          .replace(' defense', '')
          .trim();
        if (d.name.includes('all')) {
          return ['light', 'medium', 'heavy'].map((a) => ({
            level: d.level,
            name: a,
          }));
        }
        return d;
      })
      .flat()
      .reduce((acc, d) => {
        acc[d.name] = d.level;
        return acc;
      }, {});
  }

  return results;
}
