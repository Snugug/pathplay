<script lang="ts">
  import { db } from '$database';
  import Add from '$icons/add.svg?raw';
  import CharacterCard from '$components/CharacterCard.svelte';

  const characters = db.characters.toArray();
</script>

<div>
  {#await characters}
    <p>loading...</p>
  {:then characters}
    <ul class="characters">
      <li>
        <a href="/characters/new" aria-label="New character" class="add"
          >{@html Add}</a
        >
      </li>
      {#each characters as character}
        <li>
          <CharacterCard {character} />
        </li>
      {/each}
    </ul>
  {/await}
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
