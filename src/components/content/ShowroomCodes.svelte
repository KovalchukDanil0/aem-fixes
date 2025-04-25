<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<HTMLDivElement> & ShowroomCode;

  const { data: showroomConfig, ...restProps }: Props = $props();
</script>

<div {...restProps} class="showroomCodes">
  {#each Object.values(showroomConfig) as { name, code }}
    <h2>{name}</h2>
    <h3>{code}</h3>
  {/each}
</div>

<style lang="scss">
  div.showroomCodes {
    background-color: rgb(17 24 39);
    padding: 6rem;
    display: flex;
    flex-direction: column;

    h2,
    h3 {
      color: white;
    }
  }
</style>
