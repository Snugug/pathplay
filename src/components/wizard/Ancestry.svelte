<script>
  import { getContext, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import ListFilter from '$components/ListFilter.svelte';
  import ListPreview from '$components/ListPreview.svelte';
  import { filterCollection } from '$database';

  // Get the character context
  const character = getContext('character');

  $: {
    console.log($character);
  }

  // Set up the search context
  const source = writable([]);
  const results = writable([]);

  setContext('filter', {
    source,
    results,
    placeholder: 'Filter ancestries...',
  });

  // Get ancestries
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
      source.set(anc);
      results.set(anc);
    });

  /**
   * Preview an ancestry
   * @param {string} a The ancestry to preview
   * @return {function} A function to preview the ancestry
   */
  function previewAncestry(a) {
    return () => {
      console.log(a);
    };
  }
</script>

<details>
  <summary>Ancestry</summary>
  <div class="wizard">
    <ListFilter />
    {#if $results?.length > 0}
      <ul class="ancestries">
        {#each $results as item}
          <li>
            <button class="preview" on:click={previewAncestry(item)}>
              <ListPreview
                name={item.name}
                source={item.source[0].name}
                rarity={item.rarity}
                image={item.images[0]}
              />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</details>

<style lang="scss">
  details {
    padding: 1rem 0;
    border-bottom: 1px solid var(--theme-text);
  }
  summary {
    font-size: 2rem;
    cursor: pointer;
  }

  .wizard {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    // margin-top: 1rem;
    padding: 1rem;
  }

  .ancestries {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .preview {
    background: none;
    border: none;
    width: 100%;
    padding: 0;
  }
</style>
