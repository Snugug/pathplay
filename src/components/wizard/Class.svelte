<script>
  import { getContext, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import ListFilter from '$components/ListFilter.svelte';
  import ListPreview from '$components/ListPreview.svelte';
  import Ancestry from '$components/Ancestry.svelte';
  import Expand from '$icons/expand_less.svg?raw';
  import { filterCollection } from '$database';

  // Get the character context
  const character = getContext('character');
  const choices = getContext('choices');

  // Set up the search context
  const source = writable([]);
  const results = writable([]);

  let dialog;
  let preview;
  let details;

  const open = true;

  setContext('filter', {
    source,
    results,
    placeholder: 'Filter class...',
  });

  filterCollection('data', [{ key: 'type', value: 'class' }])
    .then((cls) =>
      cls
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
    .then((cls) => {
      console.log(cls);
      if (cls.length > 0) {
        source.set(cls.flat());
        results.set(cls.flat());
      }
    });

  /**
   * Preview an ancestry
   * @param {string} a The ancestry to preview
   * @return {function} A function to preview the ancestry
   */
  function previewAncestry(a) {
    return () => {
      preview = a;
      // dialog.showModal();
    };
  }

  /**
   * Select an ancestry
   */
  function select() {
    choices.set(Object.assign($choices, { class: preview }));
    character.set(
      Object.assign($character, {
        class: {
          name: preview.name,
          id: preview.url,
        },
      }),
    );
    details.removeAttribute('open');
    details.focus();
  }
</script>

<details open bind:this={details}>
  <summary><span class="position">{@html Expand}</span>Class</summary>
  <div class="wizard">
    <div class="filter">
      <ListFilter />
    </div>

    {#if $results?.length > 0}
      <ul class="ancestries">
        {#each $results as item}
          <li>
            <button class="preview" on:click={previewAncestry(item)}>
              <ListPreview
                name={item.name}
                source={item?.source.length > 0 ? item.source[0].name : ''}
                rarity={item.rarity}
                image={item?.images ? item.images[0] : {}}
              />
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <dialog bind:this={dialog} open={open ? true : null}>
      {#if preview}
        <Ancestry ancestry={preview} />

        <form class="dialog-options" method="dialog">
          <button on:click|preventDefault={select}>Choose {preview.name}</button
          >
          <button
            class="dialog-options--cancel"
            value="cancel"
            formmethod="dialog">Cancel</button
          >
        </form>
      {/if}
    </dialog>
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

  dialog[open] {
    position: sticky;
    top: 1rem;
    align-self: flex-start;
    margin: 0;
    width: 100%;
    background-color: transparent;
    border: none;
    padding: 0;
    color: var(--theme-text);
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
  }

  .position {
    display: inline-block;
    fill: var(--theme-text);
    margin-inline-end: 0.5rem;
    transition: transform 0.2s ease-in-out;
    transform: rotate(90deg);

    details[open] & {
      transform: rotate(180deg);
    }
  }

  // summary:focus {
  //   outline: 1px solid var(--theme-text);
  // }

  .filter {
    grid-column: 1 / -1;
  }

  .wizard {
    display: grid;
    grid-template-columns: 400px 1fr;
    row-gap: 1rem;
    column-gap: 2rem;
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

  .dialog-options {
    max-width: calc(65ch + 200px + 2rem);
    margin-inline: auto;
    margin-top: 1rem;
    color: var(--black);
    display: flex;
    flex-direction: row-reverse;
    gap: 1rem;

    &--cancel {
      color: var(--theme-text);
      border: 0;
      background: none;
      text-decoration: underline;
    }
  }
</style>
