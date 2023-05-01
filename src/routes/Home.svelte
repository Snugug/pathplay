<script lang="ts">
  import { db } from '$database';
  import CharacterCard from '$components/CharacterCard.svelte';
  import { writable } from 'svelte/store';

  const characters = writable(null);

  db.characters.toArray().then((c) => {
    characters.set(c);
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
    } catch (e) {
      console.error(e);
    }
    //
    // characters.update();
  }
</script>

<div>
  {#if $characters}
    <ul class="characters">
      {#each $characters as character}
        <li>
          <CharacterCard {character} on:deleteCharacter={handleDelete} />
        </li>
      {/each}
    </ul>
  {:else}
    <p>Loading...</p>
  {/if}
</div>

<style lang="scss">
  .characters {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: 2rem;

    li {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }

  .add {
    aspect-ratio: 1 / 1;
    border: 5px solid var(--theme-text);
    border-radius: 5px;
    width: 80%;
    width: 4rem;
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: center;

    :global(svg) {
      fill: var(--theme-text);
      height: 80%;
      width: 80%;
    }
  }
</style>
