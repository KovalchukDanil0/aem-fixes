<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import posthog from "./posthog";
  import type { PostHogProps } from "./types";

  type Props = HTMLButtonAttributes & PostHogProps;

  const {
    postHogEvent: posthogEvent,
    postHogConfig: posthogConfig,
    children,
    onclick,
    onauxclick,
    ...restProps
  }: Props = $props();

  function posthogCapture() {
    if (!posthogEvent) {
      return;
    }

    posthog.capture(posthogEvent, posthogConfig);
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
  {@render children?.()}
</button>
