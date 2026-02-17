<script lang="ts" module>
  import { Alert, Button, ButtonEnv, Spinner } from "$lib";
  import { onMessage, sendMessage } from "$lib/messaging";
  import { fullAuthorPath, propertiesPath, regexAuthor } from "$lib/storage";
  import ky from "ky";

  interface AlertType {
    text: string;
    color: ColorProps;
  }

  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  const regexCopyContent = /\/content.+(?=\.html)/;

  let pageLoaded = $state(false);
  let environment = $state<EnvTypes | null>(null);
  let alertBanner = $state<AlertType>();

  if (tab?.status === "complete" && tab.id) {
    pageLoaded = true;
    await fetchEnvironment(tab.id);
  }

  const setEnvironment = (env: EnvTypes) => (environment = env);

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

  async function fetchEnvironment(tabId: number) {
    environment = await sendMessage("getEnvironment", {}, tabId).catch(
      () => null,
    );
  }

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

  onMessage("showMessage", ({ data: { text, color } }) => {
    alertBanner = { text, color };
  });
</script>

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

<style lang="scss">
  @use "$assets/colors" as *;

  div.buttons-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    justify-content: center;
    align-items: center;
  }

  p.hint {
    text-shadow:
      1px 1px 2px $tertiary-color-2,
      0 0 1em $secondary-color,
      0 0 0.2em $tertiary-color-2;
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
