<script lang="ts">
  import { db } from '$database';
  import CharacterCard from '$components/CharacterCard.svelte';
  import ListFilter from '$components/ListFilter.svelte';
  import { writable } from 'svelte/store';
  import { setContext } from 'svelte';

  const characters = writable(null);
  const results = writable([]);

  db.characters.toArray().then((c) => {
    characters.set(c);
    results.set(c);
  });

  setContext('filter', {
    source: characters,
    results,
    placeholder: 'Find character...',
  });

  /**
   * Handles delete of a character
   * @param {CustomEvent} e
   */
  async function handleDelete(e: CustomEvent<{ id: number }>) {
    const { id } = e.detail;

    try {
      await db.characters.delete(id);
      const index = $characters.findIndex((c) => c.id === id);
      $characters.splice(index, 1);
      characters.set($characters);

      const resultsIndex = $results.findIndex((c) => c.id === id);
      $results.splice(resultsIndex, 1);
      results.set($results);
    } catch (e) {
      console.error(e);
    }
    //
    // characters.update();
  }
</script>

<div class="home">
  <header class="home--header">
    <h2 class="type--h2">My Characters</h2>
    <div class="home--actions">
      <a href="/characters/new" class="home--add">+ New Character</a>
      <ListFilter />
    </div>
  </header>

  {#if $results}
    <ul class="home--characters">
      {#each $results as character}
        <li class="home--character">
          <CharacterCard {character} on:deleteCharacter={handleDelete} />
        </li>
      {/each}
    </ul>
  {:else}
    <p>Loading...</p>
  {/if}
</div>

<style lang="scss">
  .home {
    &--header {
      border-bottom: 1px solid var(--theme-text);
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }

    &--actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    &--add {
      color: var(--black);
      background-color: var(--theme-text);
      border-radius: 3px;
      border: 1px solid var(--black);
      padding: 0.25rem 0.5rem;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &--characters {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
      gap: 2rem;

      li {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
    }

    &--character {
      display: flex;
      align-items: center;
    }
  }

  // .add {
  //   aspect-ratio: 1 / 1;
  //   border: 5px solid var(--theme-text);
  //   border-radius: 5px;
  //   width: 80%;
  //   width: 4rem;
  //   display: flex;
  //   justify-content: center;
  //   align-items: center;
  //   align-self: center;

  //   :global(svg) {
  //     fill: var(--theme-text);
  //     height: 80%;
  //     width: 80%;
  //   }
  // }
</style>
