<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { ColorVariant, ShapeVariant } from ".";
  import posthog from "../posthog";
  import type { PostHogProps } from "../types";
  import { mergeClass } from "../utils";

  interface Props extends HTMLButtonAttributes, Partial<PostHogProps> {
    variant?: ColorVariant;
    shape?: ShapeVariant;
  }

  const {
    class: className,
    variant,
    shape,
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
  class={mergeClass(variant, shape, className?.toString())}
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

<style lang="scss">
  @use "$assets/colors" as *;

  button {
    cursor: pointer;

    &.black {
      background-color: $primary-color;
    }

    &.gray {
      background-color: $secondary-color;
      color: black;
    }

    &.rich-black {
      background-color: $tertiary-color-1;
    }

    &.light-blue {
      background-color: $tertiary-color-2;
    }

    &.sky-blue {
      background-color: $tertiary-color-3;
      color: black;
    }

    &.rounded {
      display: flex;
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      padding-left: 1.25rem;
      padding-right: 1.25rem;
      flex-direction: row;
      gap: 0.25rem;
      border-radius: 0.75rem;
      border-style: none;
      font-size: 1.25rem;
      line-height: 1.75rem;
      text-align: center;
      transition-property: transform;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 300ms;
      box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);

      &:hover {
        transform: scale(1.05);
      }
    }
  }
</style>
