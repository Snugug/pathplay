<script lang="ts">
  import { db } from '$database';
  import { structure } from '$lib/characters';
  import AncestryWizard from '$components/wizard/Ancestry.svelte';
  import HeritageWizard from '$components/wizard/Heritage.svelte';
  import Missing from '$icons/cancel.svg?raw';
  import Done from '$icons/check_circle.svg?raw';
  import { writable } from 'svelte/store';
  import { setContext } from 'svelte';
  import { push } from 'svelte-spa-router';

  interface EditCharacterParams {
    id: string;
  }

  export let params: EditCharacterParams;

  const character = writable(null);

  const choices = writable({
    ancestry: null,
    heritage: null,
    background: null,
    class: null,
    abilities: null,
    skills: null,
    feats: null,
  });

  // It now works for both new character and edit character!
  if (params?.id) {
    db.characters.get(Number(params.id)).then((a) => {
      if (!a) {
        push('/characters/new');
        return;
      }
      if (a.ancestry.id) {
        db.data.get(a.ancestry.id).then((b) => {
          choices.set(Object.assign($choices, { ancestry: b }));
        });
      }
      character.set(a);
    });
  } else {
    const today = new Date();
    character.set(
      Object.assign(structuredClone(structure), {
        created: today,
        updated: today,
      }),
    );
    db.characters.add($character).then((a) => {
      character.set(Object.assign($character, { id: a }));
      return a;
    });
  }

  setContext('character', character);
  setContext('choices', choices);

  $: {
    console.log($choices);
  }

  $: {
    if ($character) {
      db.characters.update($character.id, $character);
    }
  }
</script>

<section class="meta">
  <h1 class="meta--title">Character Builder</h1>
  {#if $character}
    <input
      class="meta--name"
      type="text"
      aria-label="Character Name"
      placeholder="Character Name"
      bind:value={$character.name}
    />
    <div class="meta--steps">
      {#each Object.entries($choices) as [step, value]}
        <div class="meta--step">
          <h2>{step.charAt(0).toUpperCase() + step.slice(1)}</h2>
          {#if value}
            {#if value.name}
              <p class="meta--name">{value.name}</p>
            {:else}
              <div class="meta--done" aria-label="Done">{@html Done}</div>
            {/if}
          {:else}
            <div class="meta--missing" aria-label="Missing">
              {@html Missing}
            </div>
          {/if}

          <!-- <p>{JSON.stringify($choices[step])}</p> -->
        </div>
      {/each}
    </div>
  {/if}
</section>

<AncestryWizard />
<HeritageWizard />

<style lang="scss">
  .meta {
    border: 1px solid currentColor;
    padding: 0.5rem;
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1rem;
    container-type: inline-size;
    container-name: meta;

    &--name {
      grid-column: 1;
    }

    &--steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(10ch, 1fr));
      align-items: flex-start;
      justify-content: center;

      gap: 1rem;

      grid-row: 3;
      grid-column: 1 / -1;

      @container meta (min-width: 635px) {
        grid-row: 1 / span 3;
        grid-column: 2;
      }
    }

    &--step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    &--title {
      font-size: 1.25rem;
    }

    &--done {
      fill: var(--theme-green);
    }
    &--missing {
      fill: var(--theme-red);
    }
  }
</style>
