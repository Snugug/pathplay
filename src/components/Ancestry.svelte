<script>
  import Ribbon from '$components/Ribbon.svelte';
  import ImageSlider from '$components/ImageSlider.svelte';
  import { filterCollection } from '$database';
  export let ancestry;

  let sidebar = [];

  let languages = [];
  $: {
    const allLanguages = [
      ...(ancestry.languages?.known || []),
      ...(ancestry.languages?.optional || []),
    ];

    if (allLanguages.length > 0) {
      filterCollection('data', [
        { key: 'type', value: 'language' },
        { key: 'url', value: allLanguages, operator: 'in' },
      ]).then((data) => {
        languages = data;
      });
    }
  }

  let traits = [];
  $: {
    if (ancestry?.traits?.length > 0) {
      filterCollection('data', [
        { key: 'type', value: 'trait' },
        { key: 'url', value: ancestry.traits, operator: 'in' },
      ]).then((data) => {
        traits = data;
      });
    }
  }

  /**
   * Returns the trained level of a proficiency
   * @param {string} l
   * @return {string}
   */
  function trainedLevel(l) {
    switch (l) {
      case 'U':
        return 'Untrained';
      case 'T':
        return 'Trained';
      case 'E':
        return 'Expert';
      case 'M':
        return 'Master';
      case 'L':
        return 'Legendary';
      default:
        return 'Untrained';
    }
  }

  $: {
    sidebar = [];

    console.log(ancestry);

    const sbLanguages = {
      known: (ancestry.languages?.known || [])
        .filter((l, i, a) => a.indexOf(l) === i)
        .map((url) => {
          return languages.find((l) => l.url === url);
        })
        .filter((i) => i !== undefined),
      optional: (ancestry.languages?.optional || [])
        .filter((l, i, a) => a.indexOf(l) === i)
        .map((url) => {
          return languages.find((l) => l.url === url);
        })
        .filter((i) => i !== undefined),
      additional: `${
        ancestry.languages?.additional || 0
          ? ancestry.languages?.additional + ' + '
          : ''
      }INT modifier`,
    };

    if (ancestry.ability) {
      sidebar.push({
        title: 'Key Ability',
        value: ancestry.ability
          .map((a) => {
            return a.charAt(0).toUpperCase() + a.slice(1);
          })
          .join(' or '),
      });
    }

    if (ancestry.hp) {
      sidebar.push({
        title: 'Hit Points',
        value:
          ancestry.hp + `${ancestry.type === 'class' ? ' + CON modifier' : ''}`,
      });
    }

    if (ancestry.proficiencies?.saves) {
      sidebar.push({
        title: 'Saves',
        list: Object.entries(ancestry.proficiencies.saves).map(
          ([k, v]) =>
            `${k.charAt(0).toUpperCase() + k.slice(1)} - ${trainedLevel(v)}`,
        ),
      });
    }

    if (ancestry.proficiencies?.attacks) {
      // TODO: Something if "Other" is a reference
      sidebar.push({
        title: 'Attacks',
        list: Object.entries(ancestry.proficiencies.attacks)
          .filter(([k, v]) => Array.isArray(v) || v !== 'U')
          .map(([k, v]) => {
            if (Array.isArray(v)) {
              if (v.length > 0) {
                return v.map((a) => {
                  if (a.url) {
                    return `${a.url} - ${trainedLevel(a.level)}`;
                  }
                  return `${
                    a.category.charAt(0).toUpperCase() + a.category.slice(1)
                  } ${
                    a.group.charAt(0).toUpperCase() + a.group.slice(1)
                  } - ${trainedLevel(a.level)}`;
                });
              }
              return '';
            }

            return `${k.charAt(0).toUpperCase() + k.slice(1)} - ${trainedLevel(
              v,
            )}`;
          })
          .flat(),
      });
    }

    if (ancestry.proficiencies?.defenses) {
      sidebar.push({
        title: 'Defenses',
        list: Object.entries(ancestry.proficiencies.defenses).map(
          ([k, v]) =>
            `${k.charAt(0).toUpperCase() + k.slice(1)} - ${trainedLevel(v)}`,
        ),
      });
    }

    if (ancestry.proficiencies?.perception) {
      sidebar.push({
        title: 'Perception',
        value: trainedLevel(ancestry.proficiencies.perception),
      });
    }

    if (ancestry.skills) {
      let skillProf = ancestry?.proficiencies?.skills;
      if (skillProf && Object.keys(skillProf).length > 0) {
        skillProf = Object.keys(skillProf).map(
          (s) => s.charAt(0).toUpperCase() + s.slice(1),
        );
      } else {
        skillProf = null;
      }
      console.log(skillProf);
      sidebar.push({
        title: 'Skill Training',
        value: `${
          ancestry.skills || 0 ? ancestry.skills + ' + ' : ''
        }INT modifier${skillProf ? ' plus:' : ''}`,
        list: skillProf,
      });
    }

    if (ancestry.size) {
      sidebar.push({
        title: 'Size',
        value: ancestry.size.charAt(0).toUpperCase() + ancestry.size.slice(1),
      });
    }

    if (ancestry.speed) {
      sidebar.push({
        title: 'Speed',
        value: `${ancestry.speed} ft`,
      });
    }

    if (sbLanguages.known.length) {
      sidebar.push({
        title: 'Known Languages',
        list: sbLanguages.known.map((l) => l.name),
      });
    }

    if (sbLanguages.optional.length) {
      sidebar.push({
        title: 'Additional Languages',
        value:
          sbLanguages.additional +
          (sbLanguages.optional.length > 0 ? ' from:' : ''),
        list: sbLanguages.optional.map((l) => l.name),
      });
    }

    if (ancestry?.senses?.length > 0) {
      sidebar.push({
        title: 'Senses',
        list: ancestry.senses.map((s) => {
          console.log(s);
          const sense = s.type.charAt(0).toUpperCase() + s.type.slice(1);
          if (s.precision === 'precise') {
            return sense;
          }

          return `${sense} (${s.precision})`;
        }),
      });
    }

    if (traits?.length > 0) {
      sidebar.push({
        title: 'Traits',
        list: traits.map((t) => t.name),
      });
    }
  }

  $: color =
    ancestry.type === 'class'
      ? `--${ancestry.name.toLowerCase()}`
      : `--rarity-${ancestry.rarity}`;
</script>

<article
  class="ancestry"
  style={`--bkg: var(${color}); --clr: var(--${ancestry.name.toLowerCase()}-text)`}
>
  <div class="container">
    <h2 class="title type--h2">
      <Ribbon {color}>
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

      {#if ancestry.sidebar}
        <aside class="item-sidebar">{@html ancestry.sidebar}</aside>
      {/if}

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
      {#if sidebar.length}
        <dl class="sidebar--list">
          {#each sidebar as item}
            <div class="sidebar--list-item">
              <dt><div class="sidebar--ribbon">{item.title}</div></dt>
              {#if item.value && !item.list}
                <dd>{item.value}</dd>
              {/if}
              {#if item.list}
                <dd>
                  {#if item.value}
                    <p>{item.value}</p>
                  {/if}
                  <ul>
                    {#each item.list as listitem}
                      <li>{listitem}</li>
                    {/each}
                  </ul>
                </dd>
              {/if}
            </div>
          {/each}
        </dl>
      {/if}
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
      color: var(--clr, var(--black));
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
      color: var(--clr, var(--black));
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
