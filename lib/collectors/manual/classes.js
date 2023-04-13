export const classes = [
  { name: 'Alchemist' },
  { name: 'Barbarian' },
  { name: 'Bard' },
  { name: 'Champion' },
  { name: 'Cleric' },
  { name: 'Druid' },
  { name: 'Fighter' },
  { name: 'Gunslinger', id: 20, specialization: 'Ways' },
  { name: 'Inventor' },
  { name: 'Investigator' },
  { name: 'Magus' },
  { name: 'Monk' },
  { name: 'Oracle' },
  { name: 'Psychic' },
  { name: 'Ranger' },
  { name: 'Rogue' },
  { name: 'Sorcerer' },
  { name: 'Summoner' },
  { name: 'Swashbuckler' },
  {
    name: 'Thaumaturge',
    ability: 'cha',
    hp: 8,
    skills: 3,
    proficiencies: {
      class: 'T',
      perception: 'E',
      skills: {
        arcana: 'T',
        nature: 'T',
        occultism: 'T',
        religion: 'T',
      },
      saves: {
        fortitude: 'E',
        reflex: 'T',
        will: 'E',
      },
      armor: {
        unarmored: 'T',
        light: 'T',
        medium: 'T',
      },
      weapons: {
        unarmed: 'T',
        simple: 'T',
        martial: 'T',
      },
    },
  },
  {
    name: 'Witch',
    ability: 'int',
    hp: 6,
    skills: 3,
    proficiencies: {
      perception: 'T',
      saves: {
        fortitude: 'T',
        reflex: 'T',
        will: 'E',
      },
      armor: {
        unarmored: 'T',
      },
      weapons: {
        unarmed: 'T',
        simple: 'T',
      },
      spells: {
        attack: 'T',
        dc: 'T',
      },
    },
  },
  {
    name: 'Wizard',
    ability: 'int',
    hp: 6,
    skills: 2,
    proficiencies: {
      perception: 'T',
      saves: {
        fortitude: 'T',
        reflex: 'T',
        will: 'E',
      },
      weapons: {
        unarmed: 'T',
        other: [
          { name: 'Club', proficiency: 'T' },
          { name: 'Crossbow', proficiency: 'T' },
          { name: 'Dagger', proficiency: 'T' },
          { name: 'Heavy Crossbow', proficiency: 'T' },
          { name: 'Staff', proficiency: 'T' },
        ],
      },
      armor: {
        unarmored: 'T',
      },
      spells: {
        attack: 'T',
        dc: 'T',
      },
    },
  },
];

/**
 * Advancement

ASIx4 at 5n + 5
Skill Feat 2n + 2
General Feat 4n + 3
Class Feat 2n + 2
Ancestry Feat 4n + 5

 */
