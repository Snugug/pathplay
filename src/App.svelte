<script lang="ts">
  import triangles from '$lib/workers/triangles.js?url';
  import Router, { push } from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';
  import { loading } from '$stores/loading';
  import { cover } from '$stores/cover';
  import MainNav from '$components/MainNav.svelte';
  import Cover from '$components/Cover.svelte';

  const routes = {
    '/': wrap({
      asyncComponent: () => import('$routes/Home.svelte'),
    }),
    '/characters/new': wrap({
      asyncComponent: () => import('$routes/NewCharacter.svelte'),
    }),
    '/licenses': wrap({
      asyncComponent: () => import('$routes/Licenses.svelte'),
    }),
  };

  // Swap to SPA Router
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');

    if (link) {
      e.preventDefault();
      push(link.getAttribute('href'));
      cover.set(false);
    }
  });

  /**
   * Custom properties and Houdini
   */
  if (window?.CSS?.registerProperty) {
    const props = [
      'paint-alpha',
      'base-hue',
      'max-saturation',
      'max-lightness',
      'size',
    ];

    for (const prop of props) {
      try {
        window.CSS.registerProperty({
          name: `--${prop}`,
          syntax: '<number>',
          inherits: false,
          initialValue: 0,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  if (!window?.CSS?.paintWorklet) {
    import('css-paint-polyfill').then(setupHoudiniPainting);
  } else {
    setupHoudiniPainting();
  }

  /**
   * Sets up Houdini paint worklets
   */
  function setupHoudiniPainting() {
    CSS.paintWorklet.addModule(triangles);
  }
</script>

<Cover />

<div class="_main">
  <MainNav />

  <main class="_main--content" data-loading={$loading || null}>
    <Router
      {routes}
      on:routeLoading={() => loading.set(true)}
      on:routeLoaded={() => loading.set(false)}
    />
  </main>
</div>

<style lang="scss">
  ._main {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr;
    grid-template-areas:
      'nav'
      'content';
    min-height: 100vh;
    padding-inline-start: 3rem;
    padding-inline-end: 1rem;
    padding-block: 0.5rem;
    &--content {
      grid-area: content;
    }
  }
</style>
