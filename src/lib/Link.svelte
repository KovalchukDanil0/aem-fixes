<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import posthog from "./posthog";
  import type { PostHogProps } from "./types";
  import { mergeClass } from "./utils";

  type ColorVariant = "green" | "red";
  type Variant = "icon";

  interface Props extends HTMLAnchorAttributes, Partial<PostHogProps> {
    color?: ColorVariant;
    variant?: Variant;
  }

  const {
    class: className,
    color,
    variant,
    onclick,
    onauxclick,
    children,
    postHogEvent,
    postHogConfig,
    ...restProps
  }: Props = $props();

  function posthogCapture() {
    if (!postHogEvent) {
      return;
    }

    posthog.capture(postHogEvent, postHogConfig);
  }
</script>

<a
  {...restProps}
  class={mergeClass(variant && [color ?? "", variant], className?.toString())}
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
</a>

<style lang="scss">
  a {
    cursor: pointer;
    color: white;

    border-radius: 0.75rem;
    border-style: none;
    font-size: 1rem;
    line-height: 1.5rem;

    &.icon {
      display: flex;
      flex-direction: row;
      gap: 0.25rem;
      align-items: center;
    }

    &.green {
      background-color: green;
    }

    &.red {
      background-color: red;
    }
  }
</style>
