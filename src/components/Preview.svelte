<script>
  import Ribbon from '$components/Ribbon.svelte';
  import ImageSlider from '$components/ImageSlider.svelte';
  import Details from '$components/Details.svelte';
  import { filterCollection } from '$database';
  export let preview;

  let sidebar = [];

  let languages = [];
  $: {
    const allLanguages = [
      ...(preview.languages?.known || []),
      ...(preview.languages?.optional || []),
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
    if (preview?.traits?.length > 0) {
      filterCollection('data', [
        { key: 'type', value: 'trait' },
        { key: 'url', value: preview.traits, operator: 'in' },
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

    console.log(preview);

    const sbLanguages = {
      known: (preview.languages?.known || [])
        .filter((l, i, a) => a.indexOf(l) === i)
        .map((url) => {
          return languages.find((l) => l.url === url);
        })
        .filter((i) => i !== undefined),
      optional: (preview.languages?.optional || [])
        .filter((l, i, a) => a.indexOf(l) === i)
        .map((url) => {
          return languages.find((l) => l.url === url);
        })
        .filter((i) => i !== undefined),
      additional: `${
        preview.languages?.additional || 0
          ? preview.languages?.additional + ' + '
          : ''
      }INT modifier`,
    };

    if (preview.ability) {
      sidebar.push({
        title: 'Key Ability',
        value: preview.ability
          .map((a) => {
            return a.charAt(0).toUpperCase() + a.slice(1);
          })
          .join(' or '),
      });
    }

    if (preview.boosts) {
      sidebar.push({
        title: `Ability Boost${preview.boosts.length > 1 ? 's' : ''}`,
        list: preview.boosts.map((a) =>
          a.toLowerCase() === 'fre' ? 'Free' : a.toUpperCase(),
        ),
      });
    }

    if (preview.flaws) {
      sidebar.push({
        title: `Ability Flaw${preview.flaws.length > 1 ? 's' : ''}`,
        list: preview.flaws.map((a) =>
          a.toLowerCase() === 'fre' ? 'Free' : a.toUpperCase(),
        ),
      });
    }

    if (preview.hp) {
      sidebar.push({
        title: 'Hit Points',
        value:
          preview.hp + `${preview.type === 'class' ? ' + CON modifier' : ''}`,
      });
    }

    if (preview.proficiencies?.saves) {
      sidebar.push({
        title: 'Saves',
        list: Object.entries(preview.proficiencies.saves).map(
          ([k, v]) =>
            `${k.charAt(0).toUpperCase() + k.slice(1)} - ${trainedLevel(v)}`,
        ),
      });
    }

    if (preview.proficiencies?.attacks) {
      // TODO: Something if "Other" is a reference
      sidebar.push({
        title: 'Attacks',
        list: Object.entries(preview.proficiencies.attacks)
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

    if (preview.proficiencies?.defenses) {
      sidebar.push({
        title: 'Defenses',
        list: Object.entries(preview.proficiencies.defenses).map(
          ([k, v]) =>
            `${k.charAt(0).toUpperCase() + k.slice(1)} - ${trainedLevel(v)}`,
        ),
      });
    }

    if (preview.proficiencies?.perception) {
      sidebar.push({
        title: 'Perception',
        value: trainedLevel(preview.proficiencies.perception),
      });
    }

    if (preview.skills) {
      let skillProf = preview?.proficiencies?.skills;
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
          preview.skills || 0 ? preview.skills + ' + ' : ''
        }INT modifier${skillProf ? ' plus:' : ''}`,
        list: skillProf,
      });
    }

    if (preview.size) {
      sidebar.push({
        title: 'Size',
        value: preview.size.charAt(0).toUpperCase() + preview.size.slice(1),
      });
    }

    if (preview.speed) {
      sidebar.push({
        title: 'Speed',
        value: `${preview.speed} ft`,
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

    if (preview?.senses?.length > 0) {
      sidebar.push({
        title: 'Senses',
        list: preview.senses.map((s) => {
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
    preview.type === 'class'
      ? `--${preview.name.toLowerCase()}`
      : `--rarity-${preview.rarity}`;
</script>

<article
  class="preview"
  style={`--bkg: var(${color}); --clr: var(--${preview.name.toLowerCase()}-text)`}
>
  <div class="container">
    <h2 class="title type--h2">
      <Ribbon {color}>
        <span class="title--inner">
          {preview.name}
        </span>
      </Ribbon>
    </h2>

    <div class="description type">
      <div class="slider">
        <ImageSlider images={preview.images} />
      </div>
      {@html preview.description}

      {#if preview.sidebar}
        <aside class="item-sidebar">{@html preview.sidebar}</aside>
      {/if}

      {#if preview.features?.length}
        <Details title="Features">
          <ul>
            {#each preview.features as feature}
              <li class="type">
                <h3>{feature.title}</h3>
                {@html feature.description}
              </li>
            {/each}
          </ul>
        </Details>
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
      <a class="prd" href={preview.prd}>PRD</a>
    </aside>
  </div>
</article>

<style lang="scss">
  @import '$sass/shared';

  .preview {
    container-type: inline-size;
    container-name: preview;
  }

  .container {
    display: grid;
    gap: 2rem;
    // column-gap: 2rem;

    grid-template-columns: 1fr;
    margin-inline: auto;

    @container preview (min-width: 550px) {
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
    container-name: preview-desc;
  }

  .slider {
    max-width: 300px;
    margin: 0 auto;

    @container preview-desc (min-width: 430px) {
      float: right;
    }
  }

  .sidebar {
    grid-column: 1;
    grid-row: 3;

    @container preview (min-width: 550px) {
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
