<script lang="ts" module>
  import "$assets/main.scss";
  import { Input, Link } from "$lib";
  import { initPosthog } from "$lib/posthog";
  import type { SavedSyncData } from "$lib/storage";
  import { mergeClass } from "$lib/utils";
  import { ArrowLeft } from "@lucide/svelte";
  import { noCase, snakeCase } from "change-case";
  import "./style.scss";

  const savedSyncDataInit = await browser.storage.sync.get<SavedSyncData>({
    disCreateWf: false,
    disMothersiteCheck: false,
    enableFilterFix: false,
    enableFunErr: false,
  });

  const savedSyncData = Object.entries(savedSyncDataInit)
    .filter(([_, val]) => typeof val === "boolean")
    .map((data) => data as [string, boolean]);

  const settingNames: Record<keyof SavedSyncData, string> = {
    disCreateWf: "Disable Create WF Button",
    disMothersiteCheck: "Disable Mothersite Check",
    enableFilterFix: "Enable Filter Fix in Jira",
    enableFunErr: "Enable Funny Errors",
    posthog_distinct_id: "",
    tourSettings: "",
  };

  function saveSyncData(data: string, value: boolean) {
    browser.storage.sync.set<SavedSyncData>({ [data]: !value });
  }

  await initPosthog({ capture_pageview: false, autocapture: true });
</script>

<Link
  href="/popup.html"
  class="flex flex-row items-center gap-1"
  postHogEvent="back_to_popup_link_clicked"><ArrowLeft />Back</Link
>
<h2>AEM Fixes Settings</h2>

{#each savedSyncData as [name, value], idx}
  <div
    class={mergeClass(
      "flex flex-row gap-3",
      savedSyncData.length - 1 === idx && "animate-glitch",
    )}
  >
    <label class="flex flex-row gap-1 select-none"
      >{settingNames[name as keyof typeof settingNames]}<Input
        onchange={() => {
          saveSyncData(name, value);
        }}
        checked={value}
        postHogEvent="{noCase(snakeCase(name))}_setting_clicked"
        type="checkbox"
      /></label
    >
  </div>
{/each}
