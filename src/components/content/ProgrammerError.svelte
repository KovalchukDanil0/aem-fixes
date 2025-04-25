<script lang="ts">
  import type { HTMLImgAttributes } from "svelte/elements";

  interface Props extends HTMLImgAttributes {
    githubPath: string;
    memesData: MemeResponseType;
  }

  const { githubPath, memesData, ...restProps }: Props = $props();

  const generateRandom = (maxLimit: number): number =>
    Math.floor(Math.random() * maxLimit);

  const { length } = Object.keys(memesData);

  const { path: memeImage } = memesData[generateRandom(length - 1)];

  const alt = "Programmer Meme";
</script>

<img
  {...restProps}
  {alt}
  src={githubPath + memeImage}
  draggable="false"
  title={alt}
  class="completed"
/>
