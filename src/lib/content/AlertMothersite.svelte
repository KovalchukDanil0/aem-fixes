<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<EventTarget> {
    text: string;
  }

  const { text, ...restProps }: Props = $props();

  let currentElement: HTMLDivElement;
</script>

<div {...restProps} bind:this={currentElement} class="alertBanner">
  <h2>{text}</h2>
  <button
    onclick={() => {
      currentElement.remove();
    }}>X</button
  >
</div>

<style lang="scss">
  div.alertBanner {
    background-color: rgb(17 24 39 / 72%);
    padding: 1rem;
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 999;

    h2 {
      margin-top: 0;
      margin-bottom: 0;
      text-align: center;
      font-size: 1.5rem;
      line-height: 2rem;
      font-weight: 700;
      color: rgb(220 38 38);
    }

    button {
      height: 2rem;
      border-width: 1px;
      border-color: transparent;
      background-color: transparent;
      color: white;
      position: absolute;
      right: 1rem;
      top: 1rem;
    }
  }
</style>
