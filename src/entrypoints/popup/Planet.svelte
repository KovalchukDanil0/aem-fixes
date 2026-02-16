<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  type Props = HTMLAttributes<EventTarget>;

  let props: Props = $props();
</script>

<svg {...props} viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Sulfur surface shading -->
    <radialGradient id="surface" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fff7b2" />
      <stop offset="40%" stop-color="#facc15" />
      <stop offset="75%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#92400e" />
    </radialGradient>

    <!-- Volcanic hotspot glow -->
    <radialGradient id="lavaGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff3b00" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#ff7300" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#ff7300" stop-opacity="0" />
    </radialGradient>

    <!-- Thin dusty atmosphere -->
    <radialGradient id="atmosphere" cx="50%" cy="50%" r="50%">
      <stop offset="85%" stop-color="#f97316" stop-opacity="0" />
      <stop offset="100%" stop-color="#f97316" stop-opacity="0.4" />
    </radialGradient>

    <!-- Lava crack gradient -->
    <linearGradient id="crack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffedd5" />
      <stop offset="100%" stop-color="#ff3b00" />
    </linearGradient>
  </defs>

  <!-- Atmosphere glow -->
  <circle cx="300" cy="300" r="270" fill="url(#atmosphere)" />

  <!-- Planet body -->
  <circle cx="300" cy="300" r="250" fill="url(#surface)" />

  <!-- Volcanic hotspots -->
  <circle cx="420" cy="380" r="120" fill="url(#lavaGlow)" />
  <circle cx="200" cy="250" r="90" fill="url(#lavaGlow)" opacity="0.8" />
  <circle cx="330" cy="160" r="70" fill="url(#lavaGlow)" opacity="0.7" />

  <!-- Lava fissures -->
  <path
    d="M180 310 C230 280, 300 300, 350 280 S430 250, 470 300"
    stroke="url(#crack)"
    stroke-width="5"
    fill="none"
    opacity="0.9"
  />

  <path
    d="M220 200 C260 230, 310 240, 350 210 S420 170, 450 200"
    stroke="url(#crack)"
    stroke-width="3.5"
    fill="none"
    opacity="0.8"
  />

  <path
    d="M250 400 C300 380, 360 390, 400 420"
    stroke="url(#crack)"
    stroke-width="4"
    fill="none"
    opacity="0.85"
  />

  <!-- Sulfur plains variations -->
  <ellipse cx="260" cy="350" rx="120" ry="60" fill="#fde047" opacity="0.25" />

  <ellipse cx="370" cy="260" rx="100" ry="50" fill="#fbbf24" opacity="0.2" />

  <!-- Light reflection -->
  <radialGradient id="highlight" cx="30%" cy="25%" r="40%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4" />
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
  </radialGradient>
  <circle cx="300" cy="300" r="250" fill="url(#highlight)" />
</svg>

<style lang="scss">
  svg {
    width: 100%;
    bottom: -10rem;
    position: relative;
  }
</style>
