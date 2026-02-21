<script lang="ts">
  import type { Component } from "svelte";

  interface Props {
    icon: Component;

    size: number;
    zIndex: number;

    left?: number;
    top?: number;
    display?: string;
  }

  let { icon: Icon, size, left, zIndex, display }: Props = $props();
</script>

<div
  class="moon"
  style:width="{size}px"
  style:height="{size}px"
  style:left="{left}px"
  style:top="{top}px"
  style:z-index={zIndex}
  style:display
>
  <Icon />
</div>

<style lang="scss">
  .moon {
    position: absolute;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
    display: none;
  }
</style>
