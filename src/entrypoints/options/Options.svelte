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

<Link href="/popup.html" postHogEvent="back_to_popup_link_clicked">
  <ArrowLeft />
</Link>

<p>Sorry a bit ugly here, looking for inspiration</p>

<h2>AEM Fixes Settings</h2>

{#each savedSyncData as [name, value], idx}
  <div
    class={mergeClass(
      "saved-data",
      savedSyncData.length - 1 === idx && "animate-glitch",
    )}
  >
    <label class="saved-data-entry"
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

<style lang="scss">
  @keyframes glitch {
    0% {
      transform: translate(0, 0);
    }

    20% {
      transform: translate(-2px, -2px);
    }

    40% {
      transform: translate(2px, 2px);
    }

    60% {
      transform: translate(-2px, 2px);
    }

    80% {
      transform: translate(2px, -2px);
    }

    100% {
      transform: translate(0, 0);
    }
  }

  div.animate-glitch {
    animation: glitch 1s infinite;
  }

  div.saved-data {
    display: flex;
    flex-direction: row;
    gap: 0.75rem;

    &-entry {
      display: flex;
      flex-direction: row;
      gap: 0.25rem;
      user-select: none;
    }
  }
</style>
