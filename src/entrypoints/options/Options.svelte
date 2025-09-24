<script lang="ts" module>
  import "$assets/main.css";
  import { Input, Link } from "$lib";
  import { initPosthog } from "$lib/posthog";
  import type { SavedSyncData } from "$lib/storage";
  import { camelToSnakeCase } from "$lib/tools";
  import "@fontsource/open-sans/latin";
  import { Icon } from "svelte-icons-pack";
  import { FaSolidArrowLeft } from "svelte-icons-pack/fa";
  import { twMerge } from "tailwind-merge";

  const savedSyncDataInit = await browser.storage.sync.get<SavedSyncData>({
    disCreateWf: false,
    disMothersiteCheck: false,
    enableAutoLogin: false,
    enableFilterFix: false,
    enableFunErr: false,
  });

  const savedSyncData = Object.entries(savedSyncDataInit);

  const settingNames = {
    disCreateWf: "Disable Create WF Button",
    disMothersiteCheck: "Disable Mothersite Check",
    enableAutoLogin: "Enable Auto Login",
    enableFilterFix: "Enable Filter Fix in Jira",
    enableFunErr: "Enable Funny Errors",
  };

  function saveSyncData(data: string, value: boolean) {
    browser.storage.sync.set<SavedSyncData>({ [data]: !value });
  }

  await initPosthog({ capture_pageview: false, autocapture: true });
</script>

<Link
  href="/popup.html"
  class="flex flex-row items-center gap-1"
  posthogEvent={["back_to_popup_link_clicked"]}
  ><Icon src={FaSolidArrowLeft} />Back</Link
>
<h2>AEM Fixes Settings</h2>

{#each savedSyncData as [name, value], idx}
  {@debug name, value}

  <div
    class={twMerge(
      "flex flex-row gap-3",
      savedSyncData.length - 1 === idx && "animate-glitch",
    )}
  >
    <label class="flex flex-row gap-1 select-none"
      >{settingNames[name as keyof typeof settingNames]}<Input
        onchange={() => saveSyncData(name, value)}
        checked={value}
        posthogEvent={[`${camelToSnakeCase(name)}_setting_clicked`]}
        type="checkbox"
      /></label
    >
  </div>
{/each}
