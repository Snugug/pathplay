<script>
  import Wizard from '$components/wizard/Wizard.svelte';

  const filter = [{ key: 'type', value: 'class' }];
</script>

<Wizard title="Class" {filter} />
