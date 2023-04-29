<script lang="ts">
  import { db, filterCollection } from '$database';
  import { structure } from '$lib/characters';
  import AncestryWizard from '$components/wizard/Ancestry.svelte';
  import { writable } from 'svelte/store';
  import { setContext } from 'svelte';

  const today = new Date();
  const character = writable(
    Object.assign(structuredClone(structure), {
      created: today,
      updated: today,
    }),
  );

  setContext('character', character);

  db.characters.add($character).then((a) => {
    character.set(Object.assign($character, { id: a }));
    return a;
  });

  const searchSource = writable([]);
  const searchResults = writable([]);

  filterCollection('data', [{ key: 'type', value: 'ancestry' }])
    .then((anc) =>
      anc
        .sort((a, b) => a.name.localeCompare(b.name))
        .reduce(
          (acc, cur) => {
            if (cur.rarity === 'common') {
              acc[0].push(cur);
            } else if (cur.rarity === 'uncommon') {
              acc[1].push(cur);
            } else if (cur.rarity === 'rare') {
              acc[2].push(cur);
            }
            return acc;
          },
          [[], [], []],
        )
        .flat(),
    )
    .then((anc) => {
      searchSource.set(anc);
      searchResults.set(anc);
    });
</script>

<h1>New Character</h1>

<AncestryWizard />
