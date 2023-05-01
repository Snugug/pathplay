<script lang="ts">
  import { db } from '$database';
  import { structure } from '$lib/characters';
  import AncestryWizard from '$components/wizard/Ancestry.svelte';
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

  // It now works for both new character and edit character!
  if (params?.id) {
    console.log('Getting existing character');
    db.characters.get(Number(params.id)).then((a) => {
      if (!a) {
        push('/characters/new');
        return;
      }
      character.set(a);
    });
  } else {
    console.log('creating new character');
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

  const choices = writable({
    ancestry: null,
    heritage: null,
    background: null,
    class: null,
    abilities: null,
    skills: null,
    feats: null,
  });

  setContext('character', character);
  setContext('choices', choices);

  $: {
    if ($character) {
      console.log($character);
      db.characters.update($character.id, $character);
    }
  }
</script>

<section class="meta">
  <h1 class="meta--title">Character Builder</h1>
  {#if $character}
    <input
      type="text"
      aria-label="Character Name"
      placeholder="Character Name"
      bind:value={$character.name}
    />
    <div class="meta--steps">
      {#each Object.entries($choices) as [step, value]}
        <div class="meta--step">
          {#if value?.name}
            {@html Done}
          {:else}
            {@html Missing}
          {/if}
          <h2>{step}</h2>
          <!-- <p>{JSON.stringify($choices[step])}</p> -->
        </div>
      {/each}
    </div>
  {/if}
</section>

<AncestryWizard />

<style lang="scss">
  .meta {
    border: 1px solid currentColor;
    padding: 0.5rem;

    &--title {
      font-size: 1.25rem;
    }
  }
</style>
