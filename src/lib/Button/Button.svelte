<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { ButtonProps } from ".";
  import posthog from "../posthog";
  import type { PostHogProps } from "../types";
  import { mergeClass } from "../utils";

  type Props = ButtonProps &
    Omit<HTMLButtonAttributes, "color"> &
    Partial<PostHogProps>;

  const {
    class: className,
    color,
    rounded,
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
  class={mergeClass(
    `color-${color}`,
    `rounded-${rounded}`,
    className?.toString(),
  )}
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
  @use "$assets/variables" as *;

  button {
    cursor: pointer;

    display: flex;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    flex-direction: row;
    gap: 0.25rem;
    border-style: none;
    font-size: 1.25rem;
    line-height: 1.75rem;
    text-align: center;
    transition-property: transform;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;

    &:hover {
      transform: scale(1.05);
    }

    &.color {
      &-gray {
        background-color: $secondary-color;
        color: $primary-color;
      }

      &-rich-black {
        background-color: $tertiary-color-1;
      }

      &-light-blue {
        background-color: $tertiary-color-2;
      }

      &-sky-blue {
        background-color: $tertiary-color-3;
        color: $primary-color;
      }

      &-deep-space-blue {
        background-color: $tertiary-color-4;
      }

      &-air-force-blue {
        background-color: $tertiary-color-5;
        color: black;
      }
    }

    &.rounded {
      &-small {
        border-radius: 0.5rem;
      }

      &-medium {
        border-radius: 0.75rem;
      }

      &-big {
        border-radius: 4rem;
      }
    }
  }
</style>
