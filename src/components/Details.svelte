<script>
  import Expand from '$icons/expand_less.svg?raw';
  export let title = '';

  let details;

  /**
   * Close the details element
   */
  export function close() {
    details.removeAttribute('open');
    details.focus();
  }

  /**
   * Open the details element
   */
  export function open() {
    details.setAttribute('open', '');
    details.focus();
  }
</script>

<details bind:this={details}>
  <summary
    ><span class="position">{@html Expand}</span><span class="summary--title"
      >{title}</span
    ></summary
  >
  <slot />
</details>

<style lang="scss">
  details {
    padding: 1rem 0;
    border-bottom: 1px solid var(--theme-text);
  }

  summary {
    cursor: pointer;

    &::-webkit-details-marker {
      display: none;
    }
  }

  .position {
    display: inline-block;
    fill: var(--theme-text);
    margin-inline-end: 0.5rem;
    transition: transform 0.2s ease-in-out;
    transform: rotate(90deg);

    details[open] & {
      transform: rotate(180deg);
    }
  }
</style>
