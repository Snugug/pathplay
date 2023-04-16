export const structure = {
  name: 'My Character',
  portrait: null,
  level: 1,
  xp: 0,
  heroes: 0,
  speed: 0,
  ancestry: null,
  heritage: null,
  background: null,
  class: null,
  size: null,
  alignment: null,
  traits: [],
  deity: null,
  senses: [
    {
      precision: 'precise',
      sense: 'vision',
      // distance in feet if appropriate
    },
    {
      precision: 'imprecise',
      sense: 'hearing',
    },
    {
      precision: 'vague',
      sense: 'smell',
    },
  ],
  boosts: {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
    ancestry: [],
    background: [],
    class: [],
  },
  flaws: {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
    ancestry: [],
    background: [],
    class: [],
  },
  hp: {
    current: 0,
    max: 0,
    temp: 0,
  },
  // Need this, but do we also need weapons?
  // Resistances and vulnerabilities need some object with functions
  defenses: {
    armor: 0,
    resistances: [],
    vulnerabilities: [],
    shield: 0,
  },
  // Think these need to go to T/E/M/L
  proficiencies: {
    saves: {
      fortitude: 'U',
      reflex: 'U',
      will: 'U',
    },
    class: 'U',
    perception: 'U',
    skills: {
      acrobatics: 'U',
      arcana: 'U',
      athletics: 'U',
      crafting: 'U',
      deception: 'U',
      diplomacy: 'U',
      intimidation: 'U',
      lore: [
        {
          name: '',
          proficiency: 'U',
        },
      ],
      medicine: 'U',
      nature: 'U',
      occultism: 'U',
      performance: 'U',
      religion: 'U',
      society: 'U',
      stealth: 'U',
      survival: 'U',
      thievery: 'U',
    },
    armor: {
      unarmored: 'U',
      light: 'U',
      medium: 'U',
      heavy: 'U',
      other: [],
    },
    weapons: {
      unarmed: 'U',
      simple: 'U',
      martial: 'U',
      advanced: 'U',
      other: [],
    },
  },
  languages: ['common'],
  conditions: [],
  // Need to do something here about level advancement?
  feats: [],
  inventory: {
    worn: [],
    carried: [],
  },
  // Favorited actions, other actions should be auto-populated in the UI
  actions: [],
};

export const spells = {
  attack: 0,
  dc: 0,
  traditions: [],
  preparation: {
    prepared: false,
    spontaneous: false,
  },
  slots: {
    cantrip: 1,
    first: 0,
    second: 0,
    third: 0,
    fourth: 0,
    fifth: 0,
    sixth: 0,
    seventh: 0,
    eighth: 0,
    ninth: 0,
    tenth: 0,
  },
  spells: [],
};
