<script lang="ts">
  import posthog from "posthog-js/dist/module.no-external";
  import type { HTMLInputAttributes } from "svelte/elements";

  type VariantType = "green" | "red";

  interface Props extends HTMLInputAttributes {
    variant?: VariantType;
    posthogEvent?: PosthogEventType;
  }

  const { onclick, onauxclick, posthogEvent, ...restProps }: Props = $props();

  function posthogCapture({
    currentTarget: { checked },
  }: EventHandler<HTMLInputElement>) {
    if (!posthogEvent?.[0]) {
      return;
    }

    posthog.capture(posthogEvent[0], { ...posthogEvent[1], checked });
  }
</script>

<input
  {...restProps}
  onclick={(ev) => {
    onclick?.(ev);
    posthogCapture(ev);
  }}
  onauxclick={(ev) => {
    onauxclick?.(ev);
    posthogCapture(ev);
  }}
/>
