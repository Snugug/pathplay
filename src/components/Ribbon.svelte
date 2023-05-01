<script>
  export let color = '--white';
</script>

<div class="ribbon" style={`--banner: var(${color}, var(--white))`}>
  <div class="ribbon--inner">
    <slot />
  </div>
</div>

<style lang="scss">
  $extend: 1.25em;
  $cut: 0.5em;
  @import '$sass/shared';

  .ribbon {
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
    padding-bottom: $cut;

    &--inner {
      height: 1.5em;
      width: calc(100% - $extend * 2);
      margin: 0 auto;
      position: relative;
      border-radius: 2px 2px 0 0;
      box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
      background-color: var(--banner);

      &::before,
      &::after {
        content: '';
        display: block;
        position: absolute;
        bottom: -1 * $cut;
      }

      &::before {
        width: 100%;
        background-color: darken(var(--banner), 45%);
        height: $cut;
        left: 0;
        z-index: -1;
        clip-path: polygon(
          0 0,
          $cut 100%,
          $cut 0,
          100% 0,
          calc(100% - $cut) 100%,
          calc(100% - $cut) 0
        );
      }

      &::after {
        width: calc(100% + $extend * 2);
        background-color: darken(var(--banner), 15%);
        height: 1.4em;
        z-index: -2;
        left: -1 * $extend;
        clip-path: polygon(
          100% 0,
          calc(100% - $cut) 50%,
          100% 100%,
          calc(100% - $cut) 100%,
          calc(100% - $extend - $cut) 100%,
          calc(100% - $extend - $cut) 0,
          0 0,
          calc(0% + $cut) 50%,
          0 100%,
          calc(0% + $extend + $cut) 100%,
          calc(0% + $extend + $cut) 0
        );
      }
    }
  }
</style>
