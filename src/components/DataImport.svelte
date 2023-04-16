<script>
  import { onMount } from 'svelte';
  import { db, fetchAndUpdateData } from '$database';

  let size;
  let needsUpdate = false;
  let dataToUpdate = [];

  onMount(async () => {
    const { data } = await (await fetch('/data/meta.json')).json();

    const meta = await db.meta.toArray();

    dataToUpdate = data.filter((d) => {
      const current = meta.find((m) => m.type === d.type);

      if (current?.hash !== d.hash) {
        return true;
      }
      return false;
    });

    size = Math.round(
      dataToUpdate.map((d) => d.size).reduce((a, b) => a + b, 0) / 1024,
    );

    if (dataToUpdate.length) {
      needsUpdate = true;
    }
  });
</script>

{#if needsUpdate}
  <button
    on:click|preventDefault={async () =>
      await fetchAndUpdateData(dataToUpdate).then(() => (needsUpdate = false))}
    >Update data? {size}Kb</button
  >
{/if}

<style>
  button {
    position: fixed;
    bottom: 0;
    right: 0;
    background: #ffffff;
    border: 1px solid #000000;
    padding: 0.5rem;
    font-size: 1rem;
    color: #000000;
  }
</style>
