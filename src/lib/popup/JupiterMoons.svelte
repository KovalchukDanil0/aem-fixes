<script lang="ts">
  import { Callisto, Europa, Ganymede, Io } from "$assets/jupiter-moons";
  import { type Component } from "svelte";

  /* --- Constants --- */
  const WIDTH = 768;
  const HORIZON_Y = 170;
  const JUPITER_DAY = 9.925 * 3600 * 1000;

  /* --- Moon Data --- */
  let moons = $state<
    Array<{
      style: { zIndex: number; left?: number; top?: number; display?: string };
      name: string;
      period: number;
      orbitRadius: number;
      size: number;
      el: Component;
    }>
  >([
    {
      style: { zIndex: 4 },
      name: "Io",
      period: 1.769 * 86400000,
      orbitRadius: 140,
      size: 49 * 5,
      el: Io,
    },
    {
      style: { zIndex: 2 },
      name: "Europa",
      period: 3.551 * 86400000,
      orbitRadius: 170,
      size: 27 * 5,
      el: Europa,
    },
    {
      style: { zIndex: 3 },
      name: "Ganymede",
      period: 7.155 * 86400000,
      orbitRadius: 200,
      size: 28 * 5,
      el: Ganymede,
    },
    {
      style: { zIndex: 1 },
      name: "Callisto",
      period: 16.689 * 86400000,
      orbitRadius: 230,
      size: 15 * 5,
      el: Callisto,
    },
  ]);

  const time = Date.now();

  for (const { style, period, orbitRadius } of moons) {
    const orbitalAngle = ((time % period) / period) * Math.PI * 2;

    const rotationAngle = ((time % JUPITER_DAY) / JUPITER_DAY) * Math.PI * 2;

    const apparent = orbitalAngle - rotationAngle;
    const visible = Math.sin(apparent) > 0;

    if (visible) {
      const x = WIDTH / 2 + Math.cos(apparent) * orbitRadius;
      const y = HORIZON_Y - Math.sin(apparent) * 90;

      style.left = x;
      style.top = y;
      style.display = "block";
    } else {
      style.display = "none";
    }
  }
</script>

<div class="jupiter-moons">
  {#each moons as { el: El, size, style: { display, left, top, zIndex } }}
    <div
      class="moon"
      style:width="{size}px"
      style:height="{size}px"
      style:left="{left}px"
      style:top="{top}px"
      style:z-index={zIndex}
      style:display
    >
      <El />
    </div>
  {/each}
</div>

<style>
  .jupiter-moons {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .moon {
    position: absolute;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
    display: none;
  }
</style>
