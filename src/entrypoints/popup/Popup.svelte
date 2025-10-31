<script lang="ts" module>
  import "$assets/main.css";
  import { Alert, Button, ButtonEnv, Link, Spinner } from "$lib";
  import { onMessage, sendMessage } from "$lib/messaging";
  import { initPosthog } from "$lib/posthog";
  import { fullAuthorPath, propertiesPath, regexAuthor } from "$lib/storage";
  import { initTour } from "$lib/tour";
  import "@fontsource/open-sans/latin";
  import ky from "ky";
  import { Icon } from "svelte-icons-pack";
  import { FaBrandsGithub, FaSolidWrench } from "svelte-icons-pack/fa";

  const [{ url, index: tabIndex, id: tabId, status }] =
    await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

  let pageLoaded = $state(false);
  let environment = $state<EnvTypes | null>(null);

  if (status === "complete" && tabId) {
    pageLoaded = true;
    await fetchEnvironment(tabId);
  }

  async function fetchEnvironment(tabId: number) {
    environment = await sendMessage("getEnvironment", {}, tabId).catch(
      () => null,
    );
  }
</script>

<script lang="ts">
  interface AlertType {
    text: string;
    color: ColorProps;
  }

  const regexCopyContent = /\/content.+(?=\.html)/;

  let alertBanner = $state<AlertType | null>(null);

  const setEnvironment = (env: EnvTypes) => (environment = env);

  $effect(() => {
    if (!environment) {
      return;
    }
  });

  onMount(async () => {
    await initPosthog({
      capture_pageview: false,
      autocapture: true,
    });

    const tour = await initTour();
    tour?.drive();
  });

  browser.tabs.onUpdated.addListener(async (updatedTabId, changeInfo) => {
    if (updatedTabId !== tabId) {
      return;
    }

    if (changeInfo.status === "complete") {
      // browser.tabs.onUpdated.removeListener(listener);
      pageLoaded = true;
      await fetchEnvironment(updatedTabId);
    }

    if (changeInfo.status === "loading") {
      pageLoaded = false;
    }
  });

  onMessage("showMessage", ({ data: { text, color } }) => {
    alertBanner = { text, color };
  });

  function copyContent() {
    if (!url) {
      return;
    }

    const [content] = regexCopyContent.exec(url) ?? [];
    if (!content) {
      throw new Error(`copied content is ${content}`);
    }

    alertBanner = { text: `${content} copied to clipboard`, color: "info" };
    navigator.clipboard.writeText(content);
  }

  function openPropertiesTouchUI() {
    const newUrl = url?.replace(
      regexAuthor,
      `https://${fullAuthorPath}/${propertiesPath}`,
    );

    browser.tabs.create({
      url: newUrl,
      index: tabIndex + 1,
    });
  }
</script>

<div class="flex size-full grow flex-col items-center justify-center gap-5">
  {#if !pageLoaded}
    <Spinner />
    {#await ky
      .get("https://thefact.space/random")
      .json<{ text: string }>() then { text: randomFact }}
      <p class="text-shadow-lg/20">{randomFact}</p>
    {/await}
  {:else if environment}
    {#if environment === "jira"}
      <div class="flex items-center justify-center">
        <ButtonEnv
          variant="red"
          btnSubject="createWF"
          btnSendAs="tab"
          postHogEvent="jira_created_wf">Create WF</ButtonEnv
        >
      </div>
    {:else}
      <div class="hidden items-center justify-center gap-2 has-[button]:flex">
        {#if environment !== "live"}
          <ButtonEnv
            variant="green"
            btnEnv="live"
            btnSubject="toEnvironment"
            btnSendAs="runtime"
            postHogEvent="page_moved_live"
            postHogConfig={{ environment }}
          >
            To Live
          </ButtonEnv>
        {/if}

        {#if environment !== "perf"}
          <ButtonEnv
            variant="sky"
            btnEnv="perf"
            btnSubject="toEnvironment"
            btnSendAs="runtime"
            postHogEvent="page_moved_perf"
            postHogConfig={{ environment }}
          >
            To Perf
          </ButtonEnv>
        {/if}

        {#if environment !== "prod"}
          <ButtonEnv
            variant="orange"
            btnEnv="prod"
            btnSubject="toEnvironment"
            btnSendAs="runtime"
            postHogEvent="page_moved_prod"
            postHogConfig={{ environment }}
          >
            To Prod
          </ButtonEnv>
        {/if}

        {#if environment !== "cf#"}
          <ButtonEnv
            variant="amber"
            btnEnv="cf#"
            btnSubject="toEnvironment"
            btnSendAs="runtime"
            postHogEvent="page_moved_classic"
            postHogConfig={{ environment }}
          >
            To Classic
          </ButtonEnv>
        {/if}

        {#if environment !== "editor.html"}
          <ButtonEnv
            variant="teal"
            btnEnv="editor.html"
            btnSubject="toEnvironment"
            btnSendAs="runtime"
            postHogEvent="page_moved_touch"
            postHogConfig={{ environment }}
          >
            To Touch
          </ButtonEnv>
        {/if}
      </div>

      <div
        class="hidden flex-wrap items-center justify-center gap-2 has-[button]:flex"
      >
        {#if environment === "cf#" || environment === "editor.html"}
          <ButtonEnv
            variant="yellow"
            onclick={copyContent}
            postHogEvent="page_link_copied"
            postHogConfig={{ environment }}>Copy Content</ButtonEnv
          >

          <ButtonEnv
            variant="fuchsia"
            onclick={openPropertiesTouchUI}
            postHogEvent="page_properties_opened"
            postHogConfig={{ environment }}
          >
            Open Properties Touch UI
          </ButtonEnv>

          <ButtonEnv
            variant="violet"
            btnSubject="openInTree"
            btnSendAs="runtime"
            postHogEvent="page_opened_in_tree"
            postHogConfig={{ environment }}
          >
            Open In Tree
          </ButtonEnv>

          <ButtonEnv
            variant="lime"
            btnSubject="checkReferences"
            btnSendAs="tab"
            postHogEvent="page_checked_references"
            postHogConfig={{ environment }}
          >
            Check references
          </ButtonEnv>
        {/if}

        {#if environment === "live" || environment === "perf" || environment === "prod"}
          <ButtonEnv
            variant="indigo"
            btnSubject="checkMothersite"
            btnSendAs="tab"
            postHogEvent="mothersite_links_checked"
            postHogConfig={{ environment }}
          >
            Check mothersite links
          </ButtonEnv>

          <ButtonEnv
            variant="blue"
            btnSubject="showShowroomConfig"
            btnSendAs="tab"
            postHogEvent="showroom_config_showed"
            postHogConfig={{ environment }}
          >
            Show Showroom Config
          </ButtonEnv>
        {/if}
      </div>
    {/if}

    {#if alertBanner}
      <Alert variant="green" class="animate-fade duration-75"
        >{alertBanner.text}</Alert
      >
    {/if}
  {:else if url}
    <h2>{new URL(url).host}<br />Not Allowed</h2>
    <div class="flex flex-col gap-3">
      <p>I think it's</p>
      <div class="flex flex-row gap-3">
        <Button
          onclick={() => setEnvironment("live")}
          postHogEvent="page_should_be_live">live</Button
        >
        <Button
          onclick={() => setEnvironment("perf")}
          postHogEvent="page_should_be_perf">perf</Button
        >
        <Button
          onclick={() => setEnvironment("prod")}
          postHogEvent="page_should_be_prod">prod</Button
        >
        <Button
          onclick={() => setEnvironment("cf#")}
          postHogEvent="page_should_be_classic">classic</Button
        >
        <Button
          onclick={() => setEnvironment("editor.html")}
          postHogEvent="page_should_be_touch">touch ui</Button
        >
      </div>
    </div>
  {:else}
    <h2>Unknown Error Occurred</h2>
  {/if}
</div>

<div
  class="flex size-full shrink place-content-between items-end gap-2 text-white"
>
  <Link
    class="flex flex-row items-center gap-1 text-shadow-lg/20"
    href="/options.html"
    postHogEvent="options_link_clicked"
  >
    <Icon src={FaSolidWrench} />
    Options
  </Link>

  <Link
    class="flex flex-row items-center gap-1 text-shadow-lg/20"
    href="https://github.com/KovalchukDanil0/aem-fixes#features"
    target="_blank"
    postHogEvent="guide_link_clicked"
  >
    <Icon src={FaBrandsGithub} />
    See Guide
  </Link>
</div>
