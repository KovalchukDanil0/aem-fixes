<script lang="ts">
  // number of stars
  const numberOfStars = 100;

  // generate stars once when component initializes
  const stars = Array.from({ length: numberOfStars }, () => {
    const size = Math.random() * 3 + 1;

    return {
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 2 + 1,
      size,
    };
  });
</script>

<div class="sky">
  {#each stars as { duration, left, top, size }}
    <div
      class="star"
      style:width="{size}px"
      style:height="{size}px"
      style:left="{left}vw"
      style:top="{top}vh"
      style:animation-duration="{duration}s"
    ></div>
  {/each}
</div>

<style lang="scss">
  @use "$assets/variables" as *;

  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.8;
    }
    50% {
      opacity: 0.3;
    }
  }

  div.sky {
    position: fixed;
    inset: 0;
    background: $primary-color;
    overflow: hidden;
    z-index: -90;

    > div.star {
      position: absolute;
      background: white;
      border-radius: 50%;
      opacity: 0.8;
      animation: twinkle 2s infinite ease-in-out;
    }
  }
</style>
