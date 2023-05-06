<script>
  import Wizard from '$components/wizard/Wizard.svelte';
  import { getContext } from 'svelte';

  const choices = getContext('choices');

  $: filter = [
    { key: 'url', value: $choices.ancestry?.heritages || [], operator: 'in' },
  ];
</script>

<Wizard title="Heritage" {filter} />
