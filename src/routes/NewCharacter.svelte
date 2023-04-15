<script lang="ts">
  import { db } from '$database';
  import { structure } from '$lib/characters';

  const today = new Date();
  const character = Object.assign(structuredClone(structure), {
    created: today,
    updated: today,
  });

  const id = db.characters.add(character);
</script>

<h1>New Character</h1>

{#await id}
  <p>Creating character...</p>
{:then id}
  <p>Character created with id {id}</p>
{/await}
