<script>
  import Details from '$components/Details.svelte';
  import ListFilter from '$components/ListFilter.svelte';
  import ListPreview from '$components/ListPreview.svelte';
  import Preview from '$components/Preview.svelte';
  import { filterCollection } from '$database';

  import { writable } from 'svelte/store';
  import { getContext, setContext } from 'svelte';

  export let title = '';
  export let filter = [];

  // Get the character context
  const character = getContext('character');
  const choices = getContext('choices');

  // Set up the search context
  const source = writable([]);
  const results = writable([]);

  // Set up variables
  let dialog;
  let preview;
  let details;

  const keySize = 860;

  let open = window.innerWidth >= keySize;

  window.addEventListener('resize', () => {
    if (preview) {
      dialog.close();
    }
    open = window.innerWidth >= keySize;

    if (open) {
      dialog.setAttribute('open', true);
    }
  });

  // Set up context
  setContext('filter', {
    source,
    results,
    placeholder: `Filter ${title}...`,
  });

  // Get ancestries
  $: {
    if (filter.length) {
      filterCollection('data', filter)
        .then((anc) =>
          anc
            .sort((a, b) => a?.name.localeCompare(b?.name))
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
    }
  }

  /**
   * Preview selection
   * @param {string} a The item to preview
   * @return {function} A function to launch the preview
   */
  function previewAncestry(a) {
    return () => {
      preview = a;
      if (!open) {
        dialog.showModal();
      }
    };
  }

  /**
   * Select an item
   */
  function select() {
    const key = title.toLocaleLowerCase();

    choices.set(Object.assign($choices, { [key]: preview }));
    character.set(
      Object.assign($character, {
        [key]: {
          name: preview.name,
          id: preview.url,
        },
      }),
    );

    details.close();
  }
</script>

<Details bind:this={details} {title}>
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

    <dialog
      bind:this={dialog}
      data-inline={open ? true : null}
      open={open ? true : null}
    >
      {#if preview}
        <div class="view">
          <Preview {preview} />
        </div>

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
</Details>

<style lang="scss">
  :global(.summary--title) {
    font-size: 2rem;
  }

  dialog {
    // position: sticky;
    // top: 1rem;
    // left: 1rem;
    width: 100svw;
    height: 100svh;
    // border: none;
    padding: 0;
    margin: auto;
    padding: 1rem;
    color: var(--theme-text);
    background-color: var(--theme-body);
    max-height: calc(100svh - 2rem);
    max-width: calc(100svw - 2rem);
    // max-height: calc(100vh - 4rem);
    z-index: 100;
  }

  dialog[data-inline] {
    position: sticky;
    top: 1rem;
    left: unset;
    align-self: flex-start;
    width: 100%;
    height: unset;
    margin: unset;
    background-color: transparent;
    border: none;
  }

  .view {
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
  }

  .filter {
    grid-column: 1 / -1;
  }

  .wizard {
    display: grid;
    row-gap: 1rem;
    column-gap: 2rem;
    padding: 1rem;

    @media (min-width: 860px) {
      grid-template-columns: 400px 1fr;
    }
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
