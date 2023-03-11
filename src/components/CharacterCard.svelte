<script>
  import Person from '$icons/perm_identity.svg?raw';
  export let character = {};

  console.log(character);
</script>

<article
  class="character class"
  data-class={character.class?.toLowerCase() || null}
>
  <a href="/characters/{character.id}" class="link">
    <div class="portrait">
      {#if character.portrait}
        <img
          src="data:image/png;base64,{character.portrait}"
          alt={character.name}
        />
      {:else}
        {@html Person}
      {/if}
    </div>
    <h3>{character.name}</h3>
  </a>
  <div class="actions">
    <button on:click={() => console.log('edit')}>View</button>
    <button on:click={() => console.log('delete')}>Delete</button>
  </div>
</article>

<style lang="scss">
  .character {
    border-radius: 5px;
    height: 100%;
    min-height: 4rem;
  }

  .link {
    display: grid;
    grid-template-columns: 2rem 1fr;
    gap: 1rem;
    padding: 1rem;
    text-decoration: none;

    min-height: 5rem;
  }
  .actions {
    background-color: var(--theme-text);
    color: var(--theme-body);
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 1rem;
  }

  .portrait {
    aspect-ratio: 1 / 1;
    grid-row: 1 / span 2;
    border-radius: 5px;
    border: 1px solid var(--theme-body);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--theme-text);
  }
</style>
