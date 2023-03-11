<script lang="ts">
  import { cover } from '$stores/cover';
</script>

<div
  id="cover"
  data-visible={$cover || null}
  on:click={() => cover.set(!$cover)}
/>

<style lang="scss">
  @import '$sass/shared';

  #cover {
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    background: rgba(color('black'), 0.8);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.2s ease-in-out, z-index 0.2s ease-in-out;

    &[data-visible] {
      z-index: 5;
      opacity: 1;
      backdrop-filter: blur(10px);
    }
  }
</style>
