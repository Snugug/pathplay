<script lang="ts">
  import { db } from '$lib/db';
  import { structure } from '$lib/characters';

  const today = new Date();
  let character = Object.assign(structuredClone(structure), {
    created: today,
    updated: today,
  });

  db.add('characters', character).then(async (id) => {
    character = await db.get('characters', id);
    console.log(character);
  });
</script>

<h1>New Character</h1>
