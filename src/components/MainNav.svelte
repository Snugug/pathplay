<script lang="ts">
  import Menu from '$icons/menu.svg?raw';
  import MenuClose from '$icons/menu_open.svg?raw';
  import { cover } from '$stores/cover';
  import Logo from '$assets/logo.svg?raw';

  const sections = [
    [{ name: 'Characters', href: '/' }],
    [{ name: 'Licenses', href: '/licenses' }],
  ];

  $: icon = expanded ? MenuClose : Menu;
  $: label = expanded ? 'Hide navigation' : 'Show navigation';

  $: expanded = $cover;
</script>

<div id="nav" aria-expanded={expanded || null}>
  <button
    id="nav--toggle"
    aria-controls="nav--main"
    aria-label={label}
    on:click|preventDefault={() => cover.set(!expanded)}
  >
    {@html icon}
  </button>

  <nav id="nav--main">
    <a href="/" aria-label="Home" class="logo">{@html Logo}</a>
    <ul>
      {#each sections as section, i}
        {#if i !== 0}
          <li aria-hidden="true"><hr /></li>
        {/if}
        {#each section as item}
          <li>
            <a href={item.href} on:click={() => (expanded = false)}>
              {item.name}
            </a>
          </li>
        {/each}
      {/each}
    </ul>
  </nav>
</div>

<style lang="scss">
  @import '$sass/shared';

  #nav {
    $background: var(--theme-body);
    $border: var(--theme-text);
    $shadow: 3px 3px 5px 3px rgba(color('black'), 0.1);
    position: fixed;
    top: 0;
    left: 0;
    width: 200px;
    border: 1px solid $border;
    border-inline-start: none;
    // border-block-end: none;
    z-index: 10;
    background: $background;
    transform: translateX(-200px);
    transition: transform 0.2s ease-in-out;
    height: 100vh;

    &[aria-expanded],
    &:has(a:focus) {
      transform: translateX(0);
      box-shadow: $shadow;
    }

    &--toggle {
      border: 1px solid $border;
      border-left: 0;
      background: $background;
      border-radius: 0 5px 5px 0;
      height: 2rem;
      width: 2rem;
      position: absolute;
      right: calc(-2rem);
      padding: 0.25rem;
      top: -1px;
      cursor: pointer;
      box-shadow: $shadow;

      :global(svg) {
        fill: var(--theme-purple);
      }
    }
  }

  .logo {
    padding: 1rem;
    display: block;

    :global(svg) {
      width: 100%;
      fill: var(--theme-yellow);
      stroke: var(--dark-red);
      stroke-width: 0.75px;
    }

    :global(svg g:not([aria-label='PATH'])) {
      stroke-width: 0.15px;
    }
  }

  ul {
    padding-block: 0.5rem;
  }

  li {
    padding-block: 0.25rem;
    margin: 0;

    &:not([aria-hidden]) {
      margin-inline: 1rem;
    }
  }

  hr {
    margin-block: 0.5rem;
  }
</style>
