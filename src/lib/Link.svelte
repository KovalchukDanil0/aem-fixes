<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { twMerge } from "tailwind-merge";
  import posthog from "./posthog";
  import type { PostHogProps } from "./types";

  type VariantType = "green" | "red";

  interface Props extends HTMLAnchorAttributes, PostHogProps {
    variant?: VariantType;
  }

  const {
    class: className,
    variant,
    onclick,
    onauxclick,
    children,
    postHogEvent,
    postHogConfig,
    ...restProps
  }: Props = $props();

  const variantList: Record<VariantType, string> = {
    green: "bg-green-700",
    red: "bg-red-700",
  };
  const variantClass = variantList[variant as keyof typeof variantList];

  function posthogCapture() {
    if (!postHogEvent) {
      return;
    }

    posthog.capture(postHogEvent, postHogConfig);
  }
</script>

<a
  {...restProps}
  class={twMerge(
    variantClass &&
      `rounded-xl border-none px-5 py-2.5 text-xl text-white ${variantClass}`,
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
  >{#if children}
    {@render children()}
  {/if}
</a>
