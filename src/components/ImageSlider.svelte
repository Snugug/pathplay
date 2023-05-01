<script>
  export let images = [];
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(2, 15);

  /**
   * Scrolls the image into view
   * @param {Event} e
   */
  function scrollIntoView(e) {
    const target = document.querySelector(e.target.value);
    if (target.scrollIntoViewIfNeeded) {
      target.scrollIntoViewIfNeeded({ behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
</script>

{#if images?.length}
  <aside class="image-slider">
    <div class="image-slider--images">
      {#each images as image, i}
        <img
          class="image-slider--image"
          src={image.src}
          alt={image.alt || null}
          id={`i${uuid}-${i}`}
        />
      {/each}
    </div>
    {#if images.length > 1}
      <div class="image-slider--links">
        {#each images as image, i}
          <button
            class="image-slider--page"
            value={`#i${uuid}-${i}`}
            on:click={scrollIntoView}>{i + 1}</button
          >
        {/each}
      </div>
    {/if}
  </aside>
{/if}

<style lang="scss">
  @import '$sass/shared';

  .image-slider {
    width: 100%;
    overflow: hidden;
    padding: 0.5rem;

    &--images {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      gap: 2rem;
    }

    &--image {
      scroll-snap-align: start;
      filter: drop-shadow(0 0 0.5rem rgba(0, 0, 0, 0.5));
      object-fit: contain;
    }

    &--links {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    &--page {
      height: 1rem;
      width: 1rem;
      border-radius: 50%;
      flex-grow: 0;
      flex-shrink: 0;
      margin: 0 !important;
      padding: 0;
      border: none;
      font-size: 0.8rem;
      color: var(--black);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--black);
    }
  }
</style>
