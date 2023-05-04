<script>
  import Ribbon from '$components/Ribbon.svelte';
  import { createEventDispatcher } from 'svelte';
  export let character = {};

  let deleteMatch;
  let dialog;

  const dispatch = createEventDispatcher();

  /**
   * Dispatches delete event
   */
  function deleteCharacter() {
    deleteMatch = '';
    dispatch('deleteCharacter', {
      id: character.id,
    });
    dialog.close();
  }
</script>

<article class="character class">
  <a href="/characters/{character.id}" class="link">
    <div class="portrait">
      {#if character.portrait}
        <img
          src="data:image/png;base64,{character.portrait}"
          alt={character.name}
        />
      {/if}
    </div>
    <h3
      class="character--name"
      style={`color: var(--${
        character.class?.name?.toLowerCase() + '-text' || '--black'
      }, var(--black))`}
    >
      <Ribbon color={`--${character.class?.name?.toLowerCase() || '--white'}`}
        ><span class="character--inner-name">{character.name}</span></Ribbon
      >
    </h3>
  </a>
  <div class="actions">
    <a href="/characters/{character.id}/edit">Edit</a>
    <button on:click={() => dialog.showModal()}>Delete</button>
  </div>
</article>

<dialog bind:this={dialog}>
  <p>Are you sure you want to delete {character.name}?</p>
  <form method="dialog">
    <p>Type <code>DELETE</code> to confirm deletion</p>
    <input type="text" bind:value={deleteMatch} />
    <div class="dialog-actions">
      <button
        type="submit"
        disabled={deleteMatch === 'DELETE' ? null : true}
        on:click={deleteCharacter}
      >
        Delete
      </button>
      <button value="cancel" formmethod="dialog">Cancel</button>
    </div>
  </form>
</dialog>

<style lang="scss">
  .character {
    border-radius: 5px;
    height: 100%;
    min-height: 4rem;
    width: calc(100% - 3rem);

    &--name {
      font-size: 1rem;
      width: calc(100% + 3.5rem);
      transform: translateX(-1.75rem) translateY(0.5em);
      color: var(--black);
      position: absolute;
      top: 0;
    }

    &--inner-name {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
    }
  }

  .link {
    text-decoration: none;
    display: block;
    height: 5rem;
    position: relative;
  }

  .actions {
    background-color: var(--theme-text);
    color: var(--black);
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 1rem;

    a {
      color: var(--black);
    }
  }

  .portrait {
    overflow: hidden;
    height: 100%;

    img {
      object-fit: cover;
    }

    // aspect-ratio: 1 / 1;
    // grid-row: 1 / span 2;
    // border-radius: 5px;
    // border: 1px solid var(--theme-body);
    // display: flex;
    // align-items: center;
    // justify-content: center;
    // background-color: var(--theme-text);
  }
</style>
