<script>
  import ArrowForward from '$icons/arrow_forward_ios.svg?raw';
  export let name;
  export let source;
  export let rarity;
  export let image = {};
</script>

<div class="list-preview" data-images={image.src ? true : null}>
  <h3 class="list-preview--title">{name}</h3>
  <p class="list-preview--source">{source}</p>
  <p class="list-preview--rarity" style={`--bkg: var(--rarity-${rarity});`}>
    <span>{rarity}</span>
  </p>
  {#if image.src}
    <img
      class="list-preview--image"
      loading="lazy"
      src={image.src}
      alt={image.alt || null}
    />
  {/if}
  <div class="list-preview--forward" aria-hidden>
    {@html ArrowForward}
  </div>
</div>

<style lang="scss">
  .list-preview {
    font-size: 1.25rem;
    background: none;
    border: none;
    cursor: pointer;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1rem auto auto 1rem;
    text-align: left;
    row-gap: 0.5rem;
    column-gap: 0.25rem;
    background-color: var(--white);
    color: var(--black);
    width: 100%;
    border-radius: 5px;
    border: 1px solid var(--theme-dark--light-grey);
    padding: 0.25rem 0.5rem;
    padding-left: 2rem;
    padding-right: 2.5rem;
    position: relative;
    z-index: 2;

    &[data-images] {
      grid-template-columns: minmax(auto, 5.5rem) 1fr;
      padding-left: 1.5rem;
    }

    &--title,
    &--source {
      margin: 0;
      padding: 0;

      [data-images] & {
        grid-column: 2;
      }
    }

    &--title {
      grid-row: 2;
    }

    &--source {
      grid-row: 3;
      color: var(--theme-dark--light-grey);
      font-style: italic;
    }

    &--image {
      grid-row: 1 / span 4;
      align-self: flex-start;
      aspect-ratio: 1 / 1;
      object-fit: contain;
      z-index: 3;
      align-self: center;
      justify-self: center;
    }

    &--source {
      font-size: 0.75em;
    }

    &--rarity {
      position: absolute;
      writing-mode: vertical-lr;
      transform: rotate(180deg);
      font-size: 0.8rem;
      height: 100%;
      background-color: var(--bkg);
      text-transform: uppercase;
      width: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      text-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);
    }

    &--forward {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      :global(svg) {
        aspect-ratio: 1 / 1;
        width: 1.5rem;
      }
    }

    // &--rarity {
    //   --offset: calc(4.5rem + 1.5rem);
    //   font-size: 0.65rem;
    //   position: absolute;
    //   top: 0.25rem;
    //   left: var(--offset);
    //   color: var(--black);
    //   text-transform: uppercase;
    //   text-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);
    //   font-family: Arial, Helvetica, sans-serif;
    //   height: 1rem;
    //   filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));

    //   span {
    //     $size: 0.75rem;
    //     z-index: 3;
    //     position: relative;
    //     display: flex;
    //     flex-direction: column;
    //     justify-content: center;
    //     height: 100%;
    //     padding: 0.25rem;
    //     padding-right: 1rem;
    //     padding-left: 0;
    //   }

    //   &::before,
    //   &::after {
    //     content: '';
    //     position: absolute;
    //     display: block;
    //     left: calc(-1 * var(--offset) - 0.4rem);
    //   }

    //   &::before {
    //     top: 0;
    //     width: calc(var(--offset) + 0.4rem + 100%);
    //     height: 100%;
    //     background-color: var(--bkg);
    //     z-index: 2;
    //     clip-path: polygon(
    //       100% 0,
    //       calc(100% - 0.5rem) 50%,
    //       100% 100%,
    //       0 100%,
    //       0 0
    //     );
    //   }
    //   &::after {
    //     width: 0;
    //     height: 0;
    //     bottom: -0.325rem;
    //     z-index: 1;
    //     border-style: solid;
    //     border-width: 0 0.325rem 0.325rem 0;
    //     border-color: transparent color-mix(in srgb, var(--bkg) 65%, black)
    //       transparent transparent;
    //   }
    // }
  }
</style>
