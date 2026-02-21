<script lang="ts">
  import { Callisto, Europa, Ganymede, Io } from "$assets/jupiter-moons";
  import type { Component } from "svelte";
  import { Moon } from ".";

  // Constants
  const WIDTH = document.documentElement.clientWidth;
  const HORIZON_Y = 170;

  const JUPITER_DAY = 1000 * 60 * 60 * 9.925;
  const EARTH_DAY = 1000 * 60 * 60 * 24;

  // Moon Data
  let moons = $state<
    Array<{
      style: {
        zIndex: number;
        size: number;
        left?: number;
        top?: number;
        display?: string;
      };
      name: string;
      period: number;
      orbitRadius: number;
      el: Component;
    }>
  >([
    {
      style: { zIndex: 4, size: 49 * 5 },
      name: "Io",
      period: 1.769 * EARTH_DAY,
      orbitRadius: 140,
      el: Io,
    },
    {
      style: { zIndex: 2, size: 27 * 5 },
      name: "Europa",
      period: 3.551 * EARTH_DAY,
      orbitRadius: 170,
      el: Europa,
    },
    {
      style: { zIndex: 3, size: 28 * 5 },
      name: "Ganymede",
      period: 7.155 * EARTH_DAY,
      orbitRadius: 200,
      el: Ganymede,
    },
    {
      style: { zIndex: 1, size: 15 * 5 },
      name: "Callisto",
      period: 16.689 * EARTH_DAY,
      orbitRadius: 230,
      el: Callisto,
    },
  ]);

  function setMoons() {
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
  }

  setMoons();
</script>

<div class="jupiter-moons">
  {#each moons as { el, style }}
    <Moon icon={el} {...style} />
  {/each}
</div>

<style>
  .jupiter-moons {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
</style>
