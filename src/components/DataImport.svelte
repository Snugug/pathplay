<script>
  import { onMount } from 'svelte';
  import { db, fetchAndUpdateData } from '$database';

  let size;
  let updating = false;
  let dataToUpdate = [];
  let dialog;

  let updated = true;
  let open = false;

  onMount(async () => {
    const { data } = await (await fetch('/data/meta.json')).json();

    const meta = await db.meta.toArray();

    dataToUpdate = data
      .filter((d) => {
        const current = meta.find((m) => m.type === d.type);

        if (current?.hash !== d.hash) {
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.type > b.type) return 1;
        if (a.type < b.type) return -1;
        return 0;
      });

    size = Math.round(
      dataToUpdate.map((d) => d.size).reduce((a, b) => a + b, 0) / 1024,
    );

    if (size > 1024) {
      size = `${(size / 1024).toFixed(1)}MB`;
    } else {
      size = `${size}KB`;
    }

    // console.log(dataToUpdate.length);

    if (dataToUpdate.length > 0) {
      dialog.showModal();
      updated = false;
      open = true;
    }
  });

  /**
   * Fetches and updates the data in the database.
   */
  async function updateData() {
    updating = true;
    await fetchAndUpdateData(dataToUpdate);
    updating = false;
    updated = true;
    open = false;
    dialog.close('updated');
  }

  /**
   * Closes the dialog.
   */
  function close() {
    const value = dialog.returnValue;

    if (value === 'updated') {
      updated = true;
    } else {
      updated = false;
    }

    open = false;
  }

  /**
   * Opens the dialog.
   */
  function openDialog() {
    open = true;
    dialog.showModal();
  }
</script>

<dialog class="import" bind:this={dialog} on:close={close}>
  <div class="import--inner">
    {#if updating}
      <p>Updating data...</p>
    {:else}
      <div class="import--text">
        <h2>A data update is available.</h2>
        <p>
          This update is approximately {size}. It contains updates to the
          following data:
        </p>
        <ul>
          {#each dataToUpdate as data}
            <li>{data.type.replace(/-/g, ' ')}</li>
          {/each}
        </ul>
      </div>

      <form class="import--form" method="dialog">
        <button class="import--update" on:click|preventDefault={updateData}
          >Update</button
        >
        <button class="import--cancel" value="cancel" formmethod="dialog"
          >Cancel</button
        >
      </form>
    {/if}
  </div>
</dialog>

{#if !updated && !open}
  <button class="update" on:click={openDialog}>Update Data</button>
{/if}

<style lang="scss">
  .update {
    position: fixed;
    bottom: 0.5rem;
    right: 0.5rem;
    color: var(--black);
    padding: 0.25rem;
  }
  .import {
    &--inner {
      font-size: 1.25rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    // display: none;

    &--text ul {
      list-style: disc;
      margin-left: 1rem;
      columns: 2;
    }

    &--form {
      display: flex;
      flex-direction: row-reverse;
      bottom: 1.5rem;
      right: 1.5rem;
      gap: 1rem;
      justify-content: flex-start;
    }

    &--cancel {
      border: none;
      background: none;
      &:hover,
      &:focus {
        text-decoration: underline;
      }
    }
  }
</style>
