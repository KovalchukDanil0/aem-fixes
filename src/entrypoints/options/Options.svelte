<script lang="ts" module>
  import type { SavedSyncData } from "$lib/storage";
  import "$styles/main.css";
  import "@fontsource/open-sans";
  import posthog from "posthog-js";
  import { Icon } from "svelte-icons-pack";
  import { FaSolidArrowLeft } from "svelte-icons-pack/fa";
  import { twMerge } from "tailwind-merge";

  const savedSyncDataInit = await browser.storage.sync.get<SavedSyncData>({
    disCreateWF: false,
    disMothersiteCheck: false,
    enableAutoLogin: false,
    enableFilterFix: false,
    enableFunErr: false,
  });

  const settingNames = {
    disCreateWF: "Disable Create WF Button",
    disMothersiteCheck: "Disable Mothersite Check",
    enableAutoLogin: "Enable Auto Login",
    enableFilterFix: "Enable Filter Fix in Jira",
    enableFunErr: "Enable Funny Errors",
  };

  const savedSyncData = Object.entries(savedSyncDataInit);

  function saveSyncData(data: string, value: boolean) {
    browser.storage.sync.set<SavedSyncData>({ [data]: !value });
  }

  posthog.init(import.meta.env.VITE_POSTHOG_TOKEN, {
    api_host: "https://us.i.posthog.com",
    person_profiles: "identified_only",
  });
</script>

<a href="/popup.html" class="flex flex-row items-center gap-1"
  ><Icon src={FaSolidArrowLeft} />Back</a
>
<h2>AEM Fixes Settings</h2>

{#each savedSyncData as [name, value], idx}
  <div
    class={twMerge(
      "flex flex-row gap-3",
      savedSyncData.length - 1 === idx && "animate-glitch",
    )}
  >
    <label class="flex flex-row gap-1 select-none"
      >{settingNames[name as keyof typeof settingNames]}<input
        onchange={() => saveSyncData(name, value)}
        checked={value}
        type="checkbox"
      /></label
    >
  </div>
{/each}
