<script lang="ts">
  import posthog from "posthog-js/dist/module.no-external";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { twMerge } from "tailwind-merge";

  type VariantType = "green" | "red";

  interface Props extends HTMLAnchorAttributes {
    variant?: VariantType;
    posthogEvent?: PosthogEventType;
  }

  const {
    class: className,
    variant,
    onclick,
    onauxclick,
    children,
    posthogEvent,
    ...restProps
  }: Props = $props();

  const variantList: Record<VariantType, string> = {
    green: "bg-green-700",
    red: "bg-red-700",
  };
  const variantClass = variantList[variant as keyof typeof variantList];

  function posthogCapture() {
    if (!posthogEvent?.[0]) {
      return;
    }

    posthog.capture(...posthogEvent);
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
