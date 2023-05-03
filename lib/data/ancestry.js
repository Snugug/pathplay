export default {
  dwarf: {
    inventory: {
      carried: ['/weapons/13'],
    },
  },
  halfling: {
    bonuses: [
      {
        total: 2,
        type: 'circumstance',
        for: '/actions/84',
      },
    ],
  },
  lizardfolk: {
    inventory: {
      worn: [
        {
          name: 'Lizardfolk Claws',
          category: 'unarmed',
          group: '',
          damage: '1d4 Slashing',
          traits: ['/traits/179', '/traits/170', '/traits/199'],
        },
      ],
    },
    feats: ['/feats/763'],
  },
  tengu: {
    inventory: {
      worn: [
        {
          name: 'Tengu Sharp Beak',
          category: 'unarmed',
          group: '/weapon-group/4',
          damage: '1d6 Piercing',
          traits: ['/traits/179', '/traits/199'],
        },
      ],
    },
    feats: ['/feats/763'],
  },
  android: {
    defenses: {
      resistance: [
        {
          total: 1,
          type: 'circumstance',
          trait: '/traits/46',
        },
        {
          total: 1,
          type: 'circumstance',
          trait: '/traits/126',
        },
        {
          total: 1,
          type: 'circumstance',
          trait: '/traits/421',
        },
      ],
    },
    penalties: [
      {
        total: 1,
        type: 'circumstance',
        for: '/skills/6',
      },
      {
        total: 1,
        type: 'circumstance',
        for: '/skills/12',
      },
    ],
  },
  fleshwarp: {
    defenses: {
      resistance: [
        {
          trait: '/traits/46',
          value: 1,
          type: 'circumstance',
        },
        {
          trait: '/traits/126',
          value: 1,
          type: 'circumstance',
        },
      ],
    },
  },
  gnoll: {
    inventory: {
      worn: [
        {
          name: 'Gnoll Bite',
          category: 'unarmed',
          group: '/weapon-group/4',
          damage: '1d6 Piercing',
          traits: ['/traits/199'],
        },
      ],
    },
  },
  poppet: {
    defenses: {
      weakness: [
        function (character) {
          const { level } = character;
          const total = Math.floor(level / 3);
          return {
            trait: '/traits/72',
            value: total < 1 ? 1 : total,
            type: 'natural',
          };
        },
      ],
    },
  },
  // Skeleton, https://2e.aonprd.com/Rules.aspx?ID=1694
  nagaji: {
    inventory: {
      worn: [
        {
          name: 'Nagaji Fangs',
          category: 'unarmed',
          group: '/weapon-group/4',
          damage: '1d6 Piercing',
          traits: ['/traits/179', '/traits/199'],
        },
      ],
    },
  },
  sprite: {
    modifiers: [
      // Add "magical" trait to all weapons and unarmed strikes
      function (character) {
        const { worn, carried } = character.inventory;
        for (const item of [...worn, ...carried]) {
          if (
            ['unarmed', 'simple', 'martial', 'advanced'].includes(
              item?.category,
            )
          ) {
            Array.isArray(item.traits)
              ? item.traits.push('/traits/103')
              : (item.traits = ['/traits/103']);
          }
        }
      },
    ],
  },
};
