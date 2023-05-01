<script>
  import Ribbon from '$components/Ribbon.svelte';
  import ImageSlider from '$components/ImageSlider.svelte';
  import { filterCollection } from '$database';
  export let ancestry;

  // Languages
  let languages = [];
  $: knownLanguages = (ancestry.languages?.known || [])
    .filter((l, i, a) => a.indexOf(l) === i)
    .map((url) => {
      return languages.find((l) => l.url === url);
    })
    .filter((i) => i !== undefined);
  $: optionalLanguages = (ancestry.languages?.optional || [])
    .filter((l, i, a) => a.indexOf(l) === i)
    .map((url) => {
      return languages.find((l) => l.url === url);
    })
    .filter((i) => i !== undefined);

  $: additionalLanguages = `${
    ancestry.languages?.additional || 0
      ? ancestry.languages?.additional + ' + '
      : ''
  }INT modifier`;

  $: {
    languages = [];
    const allLanguages = [
      ...(ancestry.languages?.known || []),
      ...(ancestry.languages?.optional || []),
    ];

    filterCollection('data', [
      { key: 'type', value: 'language' },
      { key: 'url', value: allLanguages, operator: 'in' },
    ]).then((data) => {
      languages = data;
    });
  }

  // Traits
  let traits = [];
  $: {
    traits = [];
    filterCollection('data', [
      { key: 'type', value: 'trait' },
      { key: 'url', value: ancestry.traits, operator: 'in' },
    ]).then((data) => {
      traits = data;
    });
  }
</script>

<article class="ancestry" style={`--bkg: var(--rarity-${ancestry.rarity})`}>
  <div class="container">
    <h2 class="title type--h2">
      <Ribbon color={`--rarity-${ancestry.rarity}`}>
        <span class="title--inner">
          {ancestry.name}
        </span>
      </Ribbon>
    </h2>

    <div class="description type">
      <div class="slider">
        <ImageSlider images={ancestry.images} />
      </div>
      {@html ancestry.description}

      {#if ancestry.features?.length}
        <ul>
          {#each ancestry.features as feature}
            <li class="type">
              <h3>{feature.title}</h3>
              {@html feature.description}
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Info -->
    <aside class="sidebar">
      <dl class="sidebar--list">
        <div class="sidebar--list-item">
          <dt><div class="sidebar--ribbon">Hit Points</div></dt>
          <dd>{ancestry.hp}</dd>
        </div>

        <div class="sidebar--list-item">
          <dt><div class="sidebar--ribbon">Size</div></dt>
          <dd>
            {ancestry.size.charAt(0).toUpperCase() + ancestry.size.slice(1)}
          </dd>
        </div>
        <div class="sidebar--list-item">
          <dt><div class="sidebar--ribbon">Speed</div></dt>
          <dd>{ancestry.speed} ft</dd>
        </div>
        {#if knownLanguages.length}
          <div class="sidebar--list-item">
            <dt><div class="sidebar--ribbon">Known Languages</div></dt>
            <dd>
              <ul>
                {#each knownLanguages as language}
                  <li>{language.name}</li>
                {/each}
              </ul>
            </dd>
          </div>
        {/if}
        {#if additionalLanguages}
          <div class="sidebar--list-item">
            <dt><div class="sidebar--ribbon">Additional Languages</div></dt>
            <dd>
              <p>
                {additionalLanguages}{optionalLanguages.length > 0
                  ? ' from:'
                  : ''}
              </p>
              {#if optionalLanguages.length}
                <ul>
                  {#each optionalLanguages as language}
                    <li>{language.name}</li>
                  {/each}
                </ul>
              {/if}
            </dd>
          </div>
        {/if}
        {#if traits.length}
          <div class="sidebar--list-item">
            <dt><div class="sidebar--ribbon">Traits</div></dt>
            <dd>
              <ul>
                {#each traits as trait}
                  <li>{trait.name}</li>
                {/each}
              </ul>
            </dd>
          </div>
        {/if}
      </dl>
      <a class="prd" href={ancestry.prd}>PRD</a>
    </aside>
  </div>
</article>

<style lang="scss">
  @import '$sass/shared';

  .ancestry {
    container-type: inline-size;
    container-name: ancestry;
  }

  .container {
    display: grid;
    gap: 2rem;
    // column-gap: 2rem;

    grid-template-columns: 1fr;
    margin-inline: auto;

    @container ancestry (min-width: 550px) {
      grid-template-columns: minmax(300px, 65ch) 200px;
      max-width: max-content;
    }
  }

  .title {
    grid-column: 1 / -1;
    color: var(--black);

    &--inner {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  }

  .description {
    container-type: inline-size;
    container-name: ancestry-desc;
  }

  .slider {
    max-width: 300px;
    margin: 0 auto;

    @container ancestry-desc (min-width: 430px) {
      float: right;
    }
  }

  .sidebar {
    grid-column: 1;
    grid-row: 3;

    @container ancestry (min-width: 550px) {
      grid-column: 2;
      grid-row: 2;
    }

    &--list {
      border: 1px solid var(--theme-text);
      padding-block: 1rem;
      // padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    &--list-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    dt {
      filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
    }

    &--ribbon {
      font-weight: bold;
      background-color: var(--bkg);
      color: var(--black);
      padding: 0.15rem;
      padding-inline-start: 1.5rem;
      transform: translateX(calc(-0.5rem - 1px));
      width: max-content;
      padding-inline-end: 0.5rem;
      position: relative;
      // box-shadow: 0 2px 2px rgba(0, 0, 0, 0.5);
      z-index: 1;

      &::before,
      &::after {
        content: '';
        display: block;
        position: absolute;
      }

      &::before {
        bottom: -0.5rem;
        width: 0.5rem;
        height: 0.5rem;
        left: 0;
        z-index: -1;
        background-color: darken(var(--bkg), 45%);
        clip-path: polygon(0 0, 0.5rem 100%, 0.5rem 0);
      }

      &::after {
        top: 0;
        right: calc(-1rem + 1px);
        height: 100%;
        width: 1rem;
        background-color: var(--bkg);

        clip-path: polygon(
          100% 0,
          calc(100% - 0.5rem) 50%,
          100% 100%,
          calc(100% - 0.5rem) 100%,
          0 100%,
          0 0
        );
      }
    }

    dd {
      padding-inline-start: 1rem;

      ul {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      p + ul {
        margin-block-start: 0.5rem;
        margin-inline: 0.5rem;
      }
    }
  }

  .prd {
    display: block;
    margin-top: 1rem;
  }
</style>
