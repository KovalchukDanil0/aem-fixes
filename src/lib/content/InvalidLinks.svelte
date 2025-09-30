<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<EventTarget> {
    invalidLinksCount: number;
  }

  const { invalidLinksCount, ...restProps }: Props = $props();
</script>

<p {...restProps} class="invalidLinks">
  {invalidLinksCount} INVALID LINKS FOUND!
</p>

<style lang="scss">
  p.invalidLinks {
    padding: 1rem;
    background-color: crimson;
    color: white;
  }
</style>
