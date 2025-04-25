<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { twMerge } from "tailwind-merge";

  type VariantType = "green" | "red";

  interface Props extends HTMLAnchorAttributes {
    variant?: VariantType;
  }

  const { variant, children, class: className, ...restProps }: Props = $props();

  const variantList: Record<VariantType, string> = {
    green: "bg-green-700",
    red: "bg-red-700",
  };
  const variantClass = variantList[variant as keyof typeof variantList];
</script>

<a
  {...restProps}
  class={twMerge(
    variantClass &&
      `rounded-xl border-none px-5 py-2.5 text-xl text-white ${variantClass}`,
    className?.toString(),
  )}
  >{#if children}
    {@render children()}
  {/if}
</a>
