<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<EventTarget> {
    createWF: () => void;
  }

  const { createWF, ...restProps }: Props = $props();
</script>

<div {...restProps} class="aui-buttons" title="Create WF">
  <button class="aui-button" onclick={createWF}>Create WF</button>
</div>
