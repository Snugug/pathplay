<script>
  export let ancestry;
</script>

<article>
  <h2>{ancestry.name}</h2>
  <div class="rarity">{ancestry.rarity}</div>
  <div class="description">
    {@html ancestry.description}
  </div>
  {#each ancestry.images as image}
    <img src={image.src} alt={image.alt || null} />
  {/each}
</article>
