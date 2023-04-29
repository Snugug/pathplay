<script>
  import { getContext } from 'svelte';

  const { source, results, placeholder } = getContext('filter');

  /**
   * Filters the source list based on the query
   * @param {HTMLEvent} e
   */
  function search(e) {
    const reg = /((\w+)\s?:\s?([^|]+))+/gm;
    const query = e.target.value.toLowerCase();
    const match = query.match(reg);

    results.set(
      $source.filter((a) => {
        if (match) {
          return match.every((m) => {
            let [key, value] = m.split(':');
            key = key.trim();
            value = value.trim().toLowerCase();
            return a[key].toLowerCase() === value;
          });
        } else {
          return a.name.toLowerCase().includes(query);
        }
      }),
    );
  }
</script>

<form action="" class="search">
  <input type="search" {placeholder} on:input={search} />
</form>

<style lang="scss">
  .search {
    color: var(--black);
  }
</style>
