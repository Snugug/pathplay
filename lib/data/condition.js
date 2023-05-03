export default {
  1: {
    overrides: {
      skills: {
        perception: function (character) {
          {
            const { senses } = character;
            const precise = senses.filter(
              (sense) => sense.precision.toLowerCase() === 'precise',
            );
            if (precise.length === 1 && precise[0].name === 'Vision') {
              return character.skills.perception - 4;
            }

            return character.skills.perception;
          }
        },
      },
      conditions: [7],
    },
  },
};
