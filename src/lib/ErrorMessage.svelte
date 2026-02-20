<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<EventTarget> {
    text: string;
  }

  const { text, ...restProps }: Props = $props();
</script>

<div {...restProps} class="errorMessage">
  <img src="https://cataas.com/cat/gif" alt="Error Cat" />
  <p>{text}</p>
</div>

<style lang="scss">
  div.errorMessage {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    inset: 10%;

    img {
      width: 100%;
    }

    p {
      position: absolute;
      bottom: 0;
      text-align: center;
      color: red;
      font-size: 3rem;
      margin: 0;
    }
  }
</style>
