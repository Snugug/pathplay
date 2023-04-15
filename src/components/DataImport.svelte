<script>
  import { onMount } from 'svelte';

  let size;

  onMount(async () => {
    const { db, fetchAndUpdateData } = await import('$database');

    const { data } = await (await fetch('/data/meta.json')).json();

    const dataToUpdate = data.filter(async (d) => {
      const current = await db.data.get(d.type);
      if (current?.hash !== d.hash) {
        return true;
      }
      return false;
    });

    size = Math.round(
      dataToUpdate.map((d) => d.size).reduce((a, b) => a + b, 0) / 1024,
    );

    await fetchAndUpdateData(dataToUpdate);
  });
</script>

<h1>Total data size: {size}Kb</h1>
