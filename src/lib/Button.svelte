<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import posthog from "./posthog";
  import type { PostHogProps } from "./types";

  type Props = HTMLButtonAttributes & Partial<PostHogProps>;

  const {
    postHogEvent,
    postHogConfig,
    children,
    onclick,
    onauxclick,
    ...restProps
  }: Props = $props();

  function posthogCapture() {
    if (!postHogEvent) {
      return;
    }

    posthog.capture(postHogEvent, postHogConfig);
  }
</script>

<button
  {...restProps}
  onclick={(ev) => {
    onclick?.(ev);
    posthogCapture();
  }}
  onauxclick={(ev) => {
    onauxclick?.(ev);
    posthogCapture();
  }}
>
  {@render children?.()}
</button>
