<script lang="ts" module>
  import "$assets/main.scss";
  import {
    ButtonsContainer,
    JupiterMoons,
    StarryBackground,
    UsefulLinks,
  } from "$lib/popup";
  import { initPosthog } from "$lib/posthog";
  import { initTour } from "$lib/tour";
  import { onMount } from "svelte";
  import "./style.scss";

  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
</script>

<script lang="ts">
  onMount(async () => {
    await initPosthog({
      capture_pageview: false,
      autocapture: true,
    });

    const tour = await initTour();
    tour?.drive();

    // Do not remove
    console.log(
      "Yep, that's some realime Jupiter Moon simulation just in your browser!",
    );
  });
</script>

<main>
  <div class="content">
    <ButtonsContainer {tab} />
    <UsefulLinks />
  </div>
  <div class="background">
    <JupiterMoons />
    <StarryBackground />
  </div>
</main>

<style lang="scss">
  div.content {
    position: relative;
    padding: 0.5rem;
    padding-top: 2rem;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    flex: 1;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  div.background {
    position: absolute;
    overflow: hidden;
    width: 100%;
    height: 100%;
    z-index: -100;
  }
</style>
