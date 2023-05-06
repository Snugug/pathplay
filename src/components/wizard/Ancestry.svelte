<script>
  import Wizard from '$components/wizard/Wizard.svelte';

  const filter = [{ key: 'type', value: 'ancestry' }];
</script>

<Wizard title="Ancestry" {filter} />
