<script lang="ts" module>
  import "$assets/main.scss";
  import { Alert, Button, ButtonEnv, Link, Spinner } from "$lib";
  import { onMessage, sendMessage } from "$lib/messaging";
  import { initPosthog } from "$lib/posthog";
  import { fullAuthorPath, propertiesPath, regexAuthor } from "$lib/storage";
  import { initTour } from "$lib/tour";
  import { Github, Wrench } from "@lucide/svelte";
  import ky from "ky";
  import Planet from "./Planet.svelte";
  import StarryBackground from "./StarryBackground.svelte";
  import "./style.scss";

  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  let pageLoaded = $state(false);
  let environment = $state<EnvTypes | null>();

  if (tab?.status === "complete" && tab.id) {
    pageLoaded = true;
    await fetchEnvironment(tab.id);
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
    if (updatedTabId !== tab?.id) {
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

  async function copyContent() {
    if (!tab?.url) {
      return;
    }

    const [content] = regexCopyContent.exec(tab.url) ?? [];
    if (!content) {
      throw new Error(`copied content is undefined`);
    }

    alertBanner = { text: `${content} copied to clipboard`, color: "info" };
    await navigator.clipboard.writeText(content);
  }

  async function openPropertiesTouchUI() {
    const newUrl = tab?.url?.replace(
      regexAuthor,
      `https://${fullAuthorPath}/${propertiesPath}`,
    );

    if (!tab?.index) {
      return;
    }
    await browser.tabs.create({
      url: newUrl,
      index: tab.index + 1,
    });
  }
</script>

<main>
  <div class="content">
    <div class="buttons-container">
      {#if !pageLoaded}
        <Spinner />
        {#await ky
          .get("https://thefact.space/random")
          .json<{ text: string }>() then { text: randomFact }}
          <p class="hint">{randomFact}</p>
        {/await}
      {:else if environment}
        {#if environment === "jira"}
          <div class="box-center">
            <ButtonEnv
              variant="black"
              btnSubject="createWF"
              btnSendAs="tab"
              postHogEvent="jira_created_wf">Create WF</ButtonEnv
            >
          </div>
        {:else}
          <div class="box-hide-no-content">
            {#if environment !== "live"}
              <ButtonEnv
                variant="gray"
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
                variant="light-blue"
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
                variant="rich-black"
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
                variant="sky-blue"
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
                variant="black"
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

          <div class="box-hide-no-content wrap">
            {#if environment === "cf#" || environment === "editor.html"}
              <Button
                variant="gray"
                shape="rounded"
                onclick={copyContent}
                postHogEvent="page_link_copied"
                postHogConfig={{ environment }}>Copy Content</Button
              >

              <Button
                variant="light-blue"
                shape="rounded"
                onclick={openPropertiesTouchUI}
                postHogEvent="page_properties_opened"
                postHogConfig={{ environment }}
              >
                Open Properties Touch UI
              </Button>

              <ButtonEnv
                variant="rich-black"
                btnSubject="openInTree"
                btnSendAs="runtime"
                postHogEvent="page_opened_in_tree"
                postHogConfig={{ environment }}
              >
                Open In Tree
              </ButtonEnv>

              <ButtonEnv
                variant="sky-blue"
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
                variant="black"
                btnSubject="checkMothersite"
                btnSendAs="tab"
                postHogEvent="mothersite_links_checked"
                postHogConfig={{ environment }}
              >
                Check mothersite links
              </ButtonEnv>

              <ButtonEnv
                variant="gray"
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
          <Alert variant="green" class="">{alertBanner.text}</Alert>
        {/if}
      {:else if tab?.url}
        <h2>{new URL(tab.url).host}<br />Not Allowed</h2>
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

    <div class="useful-links">
      <Link
        variant="rounded"
        href="/options.html"
        postHogEvent="options_link_clicked"
      >
        <Wrench />
        Options
      </Link>

      <Link
        variant="rounded"
        href="https://github.com/KovalchukDanil0/aem-fixes#features"
        target="_blank"
        postHogEvent="guide_link_clicked"
      >
        <Github />
        See Guide
      </Link>
    </div>
  </div>
  <div class="background">
    <Planet />

    <StarryBackground />
  </div>
</main>

<style lang="scss">
  main {
    display: contents;
  }

  div.content {
    position: relative;
    padding: 0.5rem;
    box-sizing: border-box;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  div.background {
    position: absolute;
    bottom: 0;
    left: 0;
    overflow: hidden;
    z-index: -100;
  }

  div.buttons-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    justify-content: center;
    align-items: center;
  }

  div.useful-links {
    display: flex;
    flex-shrink: 1;
    gap: 0.5rem;
    align-items: flex-end;
    width: 100%;
    justify-content: space-between;
  }

  p.hint {
    text-shadow:
      1px 1px 2px gray,
      0 0 1em white,
      0 0 0.2em gray;
  }

  div.box-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  div.box-hide-no-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  div.wrap {
    flex-wrap: wrap;
  }
</style>
