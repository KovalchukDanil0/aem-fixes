<script lang="ts">
  import "$assets/main.scss";
  import { initPosthog } from "$lib/posthog";
  import { initTour } from "$lib/tour";
  import ButtonsContainer from "./ButtonsContainer.svelte";
  import Planet from "./Planet.svelte";
  import StarryBackground from "./StarryBackground.svelte";
  import "./style.scss";
  import UsefulLinks from "./UsefulLinks.svelte";

  onMount(async () => {
    await initPosthog({
      capture_pageview: false,
      autocapture: true,
    });

    const tour = await initTour();
    tour?.drive();
  });
</script>

<main>
  <div class="content">
    <ButtonsContainer />
    <UsefulLinks />
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
    padding-top: 2rem;
    box-sizing: border-box;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  div.background {
    position: absolute;
    bottom: 0;
    left: 0;
    overflow: hidden;
    z-index: -100;
  }
</style>
