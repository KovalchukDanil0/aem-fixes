<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import posthog from "./posthog";
  import type { PostHogProps } from "./types";
  import { mergeClass } from "./utils";

  type ColorVariant = "green" | "red";
  type Variant = "rounded";

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

    padding-top: 0.625rem;
    padding-bottom: 0.625rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    border-radius: 0.75rem;
    border-style: none;
    font-size: 1.25rem;
    line-height: 1.75rem;

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
