<script lang="ts">
  import posthog from "posthog-js/dist/module.no-external";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    posthogEvent?: PosthogEventType;
  }

  const { posthogEvent, children, onclick, onauxclick, ...restProps }: Props =
    $props();

  function posthogCapture() {
    if (!posthogEvent?.[0]) {
      return;
    }

    posthog.capture(...posthogEvent);
  }
</script>

<button
  {...restProps}
  onclick={(ev) => {
    console.log(posthogEvent);

    onclick?.(ev);
    posthogCapture();
  }}
  onauxclick={(ev) => {
    console.log(posthogEvent);

    onauxclick?.(ev);
    posthogCapture();
  }}
>
  {#if children}
    {@render children()}
  {/if}
</button>
