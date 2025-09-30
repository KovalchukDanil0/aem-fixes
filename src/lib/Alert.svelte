<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { twMerge } from "tailwind-merge";

  type VariantType = "green" | "red";

  interface Props extends HTMLAttributes<EventTarget> {
    variant?: VariantType;
  }

  const { variant, children, class: className, ...restProps }: Props = $props();

  const variantList: Record<VariantType, string> = {
    green: "bg-green-700",
    red: "bg-red-700",
  };
  const variantClass = variant ? variantList[variant] : null;
</script>

<div
  {...restProps}
  class={twMerge(
    "w-2/3 rounded-xl p-3 text-center text-lg text-white",
    variantClass,
    className?.toString(),
  )}
>
  {@render children?.()}
</div>
