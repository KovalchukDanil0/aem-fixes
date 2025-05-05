<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { twMerge } from "tailwind-merge";

  type VariantType =
    | "red"
    | "orange"
    | "sky"
    | "yellow"
    | "violet"
    | "amber"
    | "green"
    | "fuchsia"
    | "teal"
    | "lime"
    | "indigo"
    | "blue";

  interface Props extends HTMLButtonAttributes {
    variant: VariantType;
    btnSubject?: SubjectTypes;
    btnSendAs?: "tab" | "runtime";
    btnEnv?: EnvTypesExtended;
  }

  const {
    btnEnv = "live",
    class: className,
    variant,
    btnSendAs,
    btnSubject,
    children,
    onclick,
    onauxclick,
    ...restProps
  }: Props = $props();

  const variantList: Record<VariantType, string> = {
    red: "bg-red-600 shadow-red-600/50",
    orange: "bg-orange-600 shadow-orange-600/50",
    sky: "bg-sky-600 shadow-sky-600/50",
    yellow: "bg-yellow-600 shadow-yellow-600/50",
    violet: "bg-violet-600 shadow-violet-600/50",
    amber: "bg-amber-600 shadow-amber-600/50",
    green: "bg-green-600 shadow-green-600/50",
    fuchsia: "bg-fuchsia-600 shadow-fuchsia-600/50",
    teal: "bg-teal-600 shadow-teal-600/50",
    lime: "bg-lime-600 shadow-lime-600/50",
    indigo: "bg-indigo-600 shadow-indigo-600/50",
    blue: "bg-blue-600 shadow-blue-600/50",
  };
  const variantClass = variantList[variant];

  async function buttonOnClick({
    type,
    button,
  }: EventHandler<HTMLButtonElement>) {
    // check if left or middle mouse button is clicked
    if (button > 1) {
      return;
    }

    if (!btnSendAs || !btnSubject) {
      return;
    }

    const activeTabs = await browser.tabs.query({
      highlighted: true,
      currentWindow: true,
    });

    let [{ id: tabId }] = activeTabs;
    if (!tabId) {
      throw new Error(`tabId is ${tabId}`);
    }

    const message: MessageEnv = {
      from: "popup",
      newTab: type !== "click",
      env: btnEnv,
      subject: btnSubject,
      tabs: activeTabs,
    };

    if (btnSendAs === "tab") {
      await browser.tabs.sendMessage(tabId, message);
    } else {
      await browser.runtime.sendMessage(message);
    }
  }
</script>

<button
  {...restProps}
  onclick={onclick ?? buttonOnClick}
  onauxclick={onauxclick ?? buttonOnClick}
  class={twMerge(
    "flex h-13 flex-row gap-1 rounded-xl border-none px-5 py-3 text-center text-xl text-white shadow-lg transition-all hover:scale-105 focus:invert active:invert",
    variantClass,
    className?.toString(),
  )}
>
  {#if children}
    {@render children()}
  {/if}
</button>
